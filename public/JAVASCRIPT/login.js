 const signUpButton = document.getElementById("signUp");
 const signInButton = document.getElementById("signIn");
 const container = document.getElementById("container");
 const otpModal = document.getElementById("otpModal");
 const closeBtn = document.querySelector(".close");

if (signUpButton && container) {
 signUpButton.addEventListener("click", () => {
  container.classList.add("right-panel-active");
 });
}

if (signInButton && container) {
 signInButton.addEventListener("click", () => {
  container.classList.remove("right-panel-active");
 });
}

// Registration with OTP
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
       
      const fullName = document.getElementById("reg_fullname").value;
      const email = document.getElementById("reg_email").value;
      const password = document.getElementById("reg_password").value;
      const errorDiv = document.getElementById("registerError");
      const submitBtn = document.getElementById("sendOtpBtn");
       
      if (!fullName || !email || !password) {
          errorDiv.textContent = "Please fill in all fields";
          return;
      }
       
      if (password.length < 6) {
          errorDiv.textContent = "Password must be at least 6 characters";
          return;
      }
       
      try {
          if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.textContent = "Sending...";
          }
          errorDiv.textContent = "";
          const response = await fetch("../../PHP/register.php", {
              method: "POST",
              headers: {
                  "Content-Type": "application/x-www-form-urlencoded"
              },
              credentials: "same-origin",
              body: new URLSearchParams({
                  action: "send_otp_register",
                  full_name: fullName,
                  email: email,
                  password: password
              })
          });
           
          const result = await response.json();
           
          if (result.success) {
              // Store registration data
              sessionStorage.setItem("pendingEmail", email);
              sessionStorage.setItem("pendingFullName", fullName);
               
              // Show OTP modal
              document.getElementById("otpEmail").value = email;
              otpModal.style.display = "flex";
              errorDiv.textContent = "";
              document.getElementById("otpCode").value = "";
              document.getElementById("otpError").textContent = "";
          } else {
              errorDiv.textContent = result.message || "Failed to send OTP";
          }
      } catch (error) {
          errorDiv.textContent = "Error: " + error.message;
      } finally {
          if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = "Send OTP";
          }
      }
  });
}

// OTP Verification
const otpForm = document.getElementById("otpForm");
if (otpForm) {
  otpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
       
      const email = document.getElementById("otpEmail").value;
      const otp = document.getElementById("otpCode").value;
      const errorDiv = document.getElementById("otpError");
      const verifyBtn = otpForm.querySelector('button[type="submit"]');
       
      if (!otp || otp.length !== 6) {
          errorDiv.textContent = "Please enter a valid 6-digit OTP";
          return;
      }
       
      try {
          if (verifyBtn) {
              verifyBtn.disabled = true;
              verifyBtn.textContent = "Verifying...";
          }
          errorDiv.textContent = "";
          errorDiv.style.color = "red";
          const response = await fetch("../../PHP/register.php", {
              method: "POST",
              headers: {
                  "Content-Type": "application/x-www-form-urlencoded"
              },
              credentials: "same-origin",
              body: new URLSearchParams({
                  action: "verify_otp_register",
                  email: email,
                  otp: otp
              })
          });
           
          const result = await response.json();
           
          if (result.success) {
              errorDiv.textContent = "";
              alert("Registration successful! Please log in.");
              otpModal.style.display = "none";
              sessionStorage.removeItem("pendingEmail");
              sessionStorage.removeItem("pendingFullName");
               
              // Switch to login form
              container.classList.remove("right-panel-active");
              registerForm.reset();
              document.getElementById("loginForm").querySelector("input[type='email']").value = email;
          } else {
              errorDiv.textContent = result.message || "Failed to verify OTP";
          }
      } catch (error) {
          errorDiv.textContent = "Error: " + error.message;
      } finally {
          if (verifyBtn) {
              verifyBtn.disabled = false;
              verifyBtn.textContent = "Verify OTP";
          }
      }
  });
}

// Resend OTP button
const resendOtpBtn = document.getElementById("resendOtpBtn");
if (resendOtpBtn) {
  resendOtpBtn.addEventListener("click", async (e) => {
      e.preventDefault();
       
      const errorDiv = document.getElementById("otpError");
       
      try {
          errorDiv.textContent = "Sending new OTP...";
          errorDiv.style.color = "green";
          const response = await fetch("../../PHP/register.php", {
              method: "POST",
              headers: {
                  "Content-Type": "application/x-www-form-urlencoded"
              },
              credentials: "same-origin",
              body: new URLSearchParams({
                  action: "resend_otp_register"
              })
          });
           
          const result = await response.json();
           
          if (result.success) {
              errorDiv.textContent = "OTP sent successfully!";
              errorDiv.style.color = "green";
              document.getElementById("otpCode").value = "";
          } else {
              errorDiv.textContent = result.message || "Failed to resend OTP";
              errorDiv.style.color = "red";
          }
      } catch (error) {
          errorDiv.textContent = "Error: " + error.message;
          errorDiv.style.color = "red";
      }
  });
}

// Close OTP modal
if (closeBtn && otpModal) {
    closeBtn.addEventListener("click", () => {
        otpModal.style.display = "none";
    });
}

if (otpModal) {
    window.addEventListener("click", (event) => {
        if (event.target == otpModal) {
                otpModal.style.display = "none";
        }
    });
}

fetch("../../PHP/get_session_msg.php", { credentials: "same-origin" })
    .then((response) => response.ok ? response.json() : null)
    .then((messages) => {
        if (!messages) {
            return;
        }

        const loginError = document.getElementById("loginError");
        const registerError = document.getElementById("registerError");

        if (loginError && messages.login_error) {
            loginError.textContent = messages.login_error;
        }

        if (registerError && messages.register_error) {
            registerError.textContent = messages.register_error;
        }
    })
    .catch(() => {});
