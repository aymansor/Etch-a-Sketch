const modeSwitch = document.getElementById("mode-switch");
const modeSwitchIcon = document.getElementById("mode-switch-icon");

const toggleClass = (element, className) => element.classList.toggle(className);

// Check if dark mode is currently enabled
let darkModeEnabled = localStorage.getItem("dark-mode") === "enabled";

// Apply the dark-mode class to the document element
// and toggle the icon classes based on the dark mode state
document.documentElement.classList.toggle("dark-mode", darkModeEnabled);
modeSwitchIcon.classList.toggle("fa-sun", !darkModeEnabled);
modeSwitchIcon.classList.toggle("fa-moon", darkModeEnabled);

modeSwitch.addEventListener("click", () => {
  darkModeEnabled = localStorage.getItem("dark-mode") === "enabled";
  // Toggle the dark-mode class on the document element
  document.documentElement.classList.toggle("dark-mode");
  // Toggle the icon classes
  toggleClass(modeSwitchIcon, "fa-sun");
  toggleClass(modeSwitchIcon, "fa-moon");
  // Update the local storage value
  if (darkModeEnabled) {
    localStorage.removeItem("dark-mode");
  } else {
    localStorage.setItem("dark-mode", "enabled");
  }
});
