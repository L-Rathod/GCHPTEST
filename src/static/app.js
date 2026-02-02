document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Add small state hooks
  let messageTimeout = null;
  const submitButton =
    signupForm.querySelector('button[type="submit"]') ||
    signupForm.querySelector('input[type="submit"]');

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and existing UI
      activitiesList.innerHTML = "";

      // Reset select and add default placeholder
      activitySelect.innerHTML = "";
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "-- Select an activity --";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      activitySelect.appendChild(defaultOption);

      // Populate activities list (sorted)
      Object.entries(activities)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([name, details]) => {
          const activityCard = document.createElement("div");
          activityCard.className = "activity-card";

          const spotsLeft = details.max_participants - details.participants.length;

          activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft > 0 ? spotsLeft + " spots left" : "Full"}</p>
            <div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants.map(p => `<li class="participant-item"><span class="participant-email">${p}</span><button class="delete-btn" data-activity="${name}" data-email="${p}" aria-label="Remove ${p}">✖</button></li>`).join('')}
              </ul>
            </div>
          `;

          if (spotsLeft <= 0) {
            activityCard.classList.add("full");
          }

          activitiesList.appendChild(activityCard);

          // Add option to select dropdown; disable if full
          const option = document.createElement("option");
          option.value = name;
          option.textContent = spotsLeft > 0 ? name : `${name} (Full)`;
          if (spotsLeft <= 0) {
            option.disabled = true;
          }
          activitySelect.appendChild(option);

          // Attach delete handlers
          activityCard.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
              const email = btn.getAttribute('data-email');
              const activityName = btn.getAttribute('data-activity');
              try {
                const res = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
                const result = await res.json();
                if (res.ok) {
                  messageDiv.textContent = result.message;
                  messageDiv.className = 'success';
                  // Disable the button while refreshing
                  btn.disabled = true;
                  await fetchActivities();
                  btn.disabled = false;
                } else {
                  messageDiv.textContent = result.detail || 'Failed to unregister';
                  messageDiv.className = 'error';
                }
                messageDiv.classList.remove('hidden');
                setTimeout(()=> messageDiv.classList.add('hidden'), 5000);
              } catch (err) {
                console.error(err);
                messageDiv.textContent = 'Failed to unregister. Please try again.';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
                setTimeout(()=> messageDiv.classList.add('hidden'), 5000);
              }
            });
          });
        });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    if (!activity) {
      // show immediate feedback
      messageDiv.textContent = "Please select an activity.";
      messageDiv.classList.remove("success");
      messageDiv.classList.add("error");
      messageDiv.setAttribute("role", "status");
      messageDiv.classList.remove("hidden");
      if (messageTimeout) clearTimeout(messageTimeout);
      messageTimeout = setTimeout(() => messageDiv.classList.add("hidden"), 5000);
      return;
    }

    // Simple guard
    if (!email || !activity) return;

    try {
      // Prevent double submits
      if (submitButton) submitButton.disabled = true;

      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      let result = {};
      try {
        result = await response.json();
      } catch (e) {
        // non-json response fallback
        result = { message: response.ok ? "Success" : "An error occurred" };
      }

      // Clear previous message timeout
      if (messageTimeout) clearTimeout(messageTimeout);

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.classList.remove("error");
        messageDiv.classList.add("success");
        signupForm.reset();
        // Wait for the refreshed activities to finish rendering
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || result.message || "An error occurred";
        messageDiv.classList.remove("success");
        messageDiv.classList.add("error");
      }

      messageDiv.setAttribute("role", "status");
      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      messageTimeout = setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.classList.remove("success");
      messageDiv.classList.add("error");
      messageDiv.setAttribute("role", "status");
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  // Initialize app
  fetchActivities();
});