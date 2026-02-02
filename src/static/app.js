document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
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

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

async function fetchActivities() {
  try {
    const res = await fetch("/activities");
    if (!res.ok) throw new Error("Failed to load activities");
    const data = await res.json();
    renderActivities(data);
  } catch (err) {
    document.getElementById("activities").innerHTML = `<p class="msg">Error loading activities.</p>`;
    console.error(err);
  }
}

function renderActivities(activities) {
  const container = document.getElementById("activities");
  container.innerHTML = "";
  Object.entries(activities).forEach(([name, info]) => {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = name;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = info.schedule || "";

    const desc = document.createElement("div");
    desc.className = "desc";
    desc.textContent = info.description || "";

    // Participants list
    const pTitle = document.createElement("strong");
    pTitle.textContent = "Participants:";

    const list = document.createElement("ul");
    list.className = "participants";
    (info.participants || []).forEach(p => {
      const li = document.createElement("li");
      li.textContent = p;
      list.appendChild(li);
    });

    // Signup form
    const formRow = document.createElement("div");
    formRow.className = "form-row";

    const input = document.createElement("input");
    input.type = "email";
    input.placeholder = "you@school.edu";
    input.required = true;

    const btn = document.createElement("button");
    btn.textContent = "Sign up";

    formRow.appendChild(input);
    formRow.appendChild(btn);

    const msg = document.createElement("div");
    msg.className = "msg";

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!email) { msg.textContent = "Please enter an email."; return; }
      btn.disabled = true;
      msg.textContent = "Signing up...";
      try {
        const url = `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`;
        const res = await fetch(url, {method: "POST"});
        const body = await res.json();
        if (!res.ok) throw new Error(body.detail || body.message || "Signup failed");
        msg.textContent = body.message || "Signed up!";
        input.value = "";
        // refresh activities to show updated participants
        await fetchActivities();
      } catch (err) {
        msg.textContent = err.message;
      } finally {
        btn.disabled = false;
      }
    });

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(desc);
    card.appendChild(pTitle);
    card.appendChild(list);
    card.appendChild(formRow);
    card.appendChild(msg);

    container.appendChild(card);
  });
}
