const signUpButton = document.getElementById("signUp");
const signInButton = document.getElementById("signIn");
const container = document.getElementById("container");

signUpButton.addEventListener("click", () => {
  container.classList.add("right-panel-active");
});

signInButton.addEventListener("click", () => {
  container.classList.remove("right-panel-active");
});

function showMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el || !text) return;
  el.textContent = text;
  el.className = "form-message " + type;
  el.style.display = "block";
}

async function loadSessionMessages() {
  const params = new URLSearchParams(window.location.search);
  const registered = params.get("registered");

  if (registered) {
    showMsg("loginMsg", "Account created! Please sign in.", "success");
  }

  try {
    const res = await fetch("../../PHP/get_session_msg.php", { credentials: "same-origin" });
    const data = await res.json();
    if (data.login_error) showMsg("loginMsg", data.login_error, "error");
    if (data.register_error) showMsg("registerMsg", data.register_error, "error");
  } catch (_) {
    // Non-fatal: page still works without flash messages
  }
}

loadSessionMessages();
