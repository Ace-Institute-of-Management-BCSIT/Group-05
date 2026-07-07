 const signUpButton = document.getElementById("signUp");
 const signInButton = document.getElementById("signIn");
 const container = document.getElementById("container");
 const otpModal = document.getElementById("otpModal");
 const closeBtn = document.querySelector(".close");

 signUpButton.addEventListener("click", () => {
  container.classList.add("right-panel-active");
 });

 signInButton.addEventListener("click", () => {
  container.classList.remove("right-panel-active");
 });

// Registration with OTP
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
       
      const fullName = document.getElementById("reg_fullname").value;
      const email = document.getElementById("reg_email").value;
      const password = document.getElementById("reg_password").value;
      const errorDiv = document.getElementById("registerError");
       
      if (!fullName || !email || !password) {
          errorDiv.textContent = "Please fill in all fields";
          return;
      }
       
      if (password.length < 6) {
          errorDiv.textContent = "Password must be at least 6 characters";
          return;
      }
       
      try {
          const response = await fetch("../../PHP/register.php", {
              method: "POST",
              headers: {
                  "Content-Type": "application/x-www-form-urlencoded"
              },
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
              sessionStorage.setItem("pendingPassword", password);
               
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
       
      if (!otp || otp.length !== 6) {
          errorDiv.textContent = "Please enter a valid 6-digit OTP";
          return;
      }
       
      try {
          const response = await fetch("../../PHP/register.php", {
              method: "POST",
              headers: {
                  "Content-Type": "application/x-www-form-urlencoded"
              },
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
              sessionStorage.removeItem("pendingPassword");
               
              // Switch to login form
              container.classList.remove("right-panel-active");
              registerForm.reset();
              document.getElementById("loginForm").querySelector("input[type='email']").value = email;
          } else {
              errorDiv.textContent = result.message || "Failed to verify OTP";
          }
      } catch (error) {
          errorDiv.textContent = "Error: " + error.message;
      }
  });
}

// Resend OTP button
const resendOtpBtn = document.getElementById("resendOtpBtn");
if (resendOtpBtn) {
  resendOtpBtn.addEventListener("click", async (e) => {
      e.preventDefault();
       
      const email = document.getElementById("otpEmail").value;
      const errorDiv = document.getElementById("otpError");
       
      try {
          const response = await fetch("../../PHP/otp.php", {
              method: "POST",
              headers: {
                  "Content-Type": "application/x-www-form-urlencoded"
              },
              body: new URLSearchParams({
                  action: "send_otp",
                  email: email
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
closeBtn.addEventListener("click", () => {
  otpModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target == otpModal) {
      otpModal.style.display = "none";
  }
});