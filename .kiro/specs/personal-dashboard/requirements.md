# Requirements Document

## Introduction

A personal productivity dashboard delivered as a standalone web application built with HTML, CSS, and Vanilla JavaScript. The dashboard surfaces a greeting with live time and date, a Pomodoro focus timer, a to-do list, and a quick-links launcher — all persisted client-side via the Browser Local Storage API. A light/dark mode toggle and customisable user name and timer duration round out the interactive experience. The entire app is contained in one HTML file, one CSS file (`css/`), and one JavaScript file (`js/`), with no build tools or external frameworks required.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **User**: The person operating the Dashboard in a modern browser.
- **Local_Storage**: The Browser Local Storage API used for all client-side data persistence.
- **Greeting_Widget**: The UI region that displays the current time, date, and a time-of-day greeting.
- **Timer**: The Pomodoro focus countdown timer component.
- **Todo_List**: The task management component within the Dashboard.
- **Task**: A single to-do item stored and managed by the Todo_List.
- **Quick_Links**: The component that displays user-defined bookmark buttons.
- **Link**: A single URL entry stored and managed by Quick_Links.
- **Theme**: The visual colour scheme of the Dashboard, either `light` or `dark`.
- **Session**: A single uninterrupted Timer countdown run from start to zero or until stopped.

---

## Requirements

### Requirement 1: Live Greeting Display

**User Story:** As a User, I want to see the current time, date, and a personalised greeting on the Dashboard, so that I can orient myself at a glance without switching apps.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time in 12-hour format (hh:mm:ss AM/PM), updated every second with a maximum drift of 1 second from the system clock.
2. THE Greeting_Widget SHALL display the current local date in the format "Day, Month DD, YYYY" (e.g., "Monday, January 6, 2025").
3. IF the current local hour is in the range 05:00–11:59 inclusive, THEN THE Greeting_Widget SHALL display the greeting prefix "Good morning".
4. IF the current local hour is in the range 12:00–17:59 inclusive, THEN THE Greeting_Widget SHALL display the greeting prefix "Good afternoon".
5. IF the current local hour is in the range 18:00–23:59 or 00:00–04:59 inclusive, THEN THE Greeting_Widget SHALL display the greeting prefix "Good evening".
6. WHEN a User name of 1–50 characters has been saved, THE Greeting_Widget SHALL display the greeting as the greeting prefix followed by a comma, a space, and the saved name (e.g., "Good morning, Alex").
7. WHEN no User name has been saved, THE Greeting_Widget SHALL display the greeting prefix without a name suffix.

---

### Requirement 2: Custom User Name

**User Story:** As a User, I want to set and update my name on the Dashboard, so that the greeting feels personalised to me.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a text input field (maximum 50 characters) and a save button for the User to enter a display name, where pressing the Enter key within the input field SHALL act as an equivalent trigger to clicking the save button.
2. WHEN the User submits a non-empty name of 1–50 characters, THE Dashboard SHALL save the name to Local_Storage.
3. WHEN the User submits a non-empty name of 1–50 characters, THE Greeting_Widget SHALL update to reflect the new name within 300 milliseconds without a page reload.
4. WHEN the Dashboard loads, THE Dashboard SHALL read the saved name from Local_Storage and pre-populate the name input field with it.
5. IF the User submits an empty name, THEN THE Dashboard SHALL remove the stored name from Local_Storage and revert the greeting to display a name-less salutation (e.g., "Hello!").
6. IF the User submits a name exceeding 50 characters, THEN THE Dashboard SHALL reject the submission, preserve the existing stored name unchanged, and display an error message indicating the character limit has been exceeded.

---

### Requirement 3: Focus Timer (Pomodoro)

**User Story:** As a User, I want a countdown timer I can start, stop, and reset, so that I can use the Pomodoro technique to manage focused work sessions.

#### Acceptance Criteria

1. THE Timer SHALL display remaining time in MM:SS format.
2. WHEN the Dashboard loads, THE Timer SHALL initialise to the saved duration from Local_Storage, or 25 minutes if no duration has been saved.
3. WHEN the User activates the Start control and no Session is currently running, THE Timer SHALL begin counting down one second at a time.
4. WHEN the User activates the Stop control during a Session, THE Timer SHALL pause the countdown and retain the remaining time.
5. WHEN the User activates the Reset control, THE Timer SHALL stop any running countdown and restore the display to the current configured duration.
6. WHEN the Timer countdown reaches 00:00, THE Timer SHALL stop automatically.
7. WHEN the Timer countdown reaches 00:00, THE Dashboard SHALL play an audible alert once to notify the User.
8. WHILE a Session is running, THE Timer SHALL disable the duration input field to prevent mid-session changes.
9. WHILE no Session is active, THE Dashboard SHALL display an input field for the User to set a custom timer duration in whole minutes between 1 and 99.
10. WHEN the User submits a valid custom duration by pressing Enter or activating a Save control, THE Timer SHALL save the duration to Local_Storage and reset the display to the new duration.
11. IF the User submits a timer duration outside the range of 1 to 99 minutes, THEN THE Dashboard SHALL reject the input, display an error message indicating the valid range, and retain the previous duration.

---

### Requirement 4: To-Do List

**User Story:** As a User, I want to add, edit, complete, and delete tasks on the Dashboard, so that I can track my work items without leaving the page.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Todo_List SHALL display all Tasks retrieved from Local_Storage.
2. WHEN the User submits a task description that is non-empty after trimming leading and trailing whitespace, THE Todo_List SHALL add a new Task with a unique identifier, the trimmed description, and a completion status of `false`.
3. WHEN a Task is added, THE Todo_List SHALL save the updated Task list to Local_Storage.
4. WHEN the User activates the complete toggle on a Task, THE Todo_List SHALL toggle the Task's completion status between `true` and `false`.
5. WHEN a Task's completion status changes, THE Todo_List SHALL render completed Tasks with strikethrough text and incomplete Tasks without strikethrough text.
6. WHEN a Task's completion status changes, THE Todo_List SHALL save the updated Task list to Local_Storage.
7. WHEN the User activates the edit control on a Task, THE Todo_List SHALL present an inline editable input pre-filled with the Task's current description.
8. WHEN the User confirms an edit with a description that is non-empty after trimming leading and trailing whitespace, THE Todo_List SHALL update the Task's description to the trimmed value and save the updated list to Local_Storage.
9. IF the User confirms an edit with a description that is empty or contains only whitespace, THEN THE Todo_List SHALL discard the change and retain the original description.
10. WHEN the User cancels an edit without confirming, THE Todo_List SHALL discard all changes and restore the Task's original description in the display.
11. WHEN the User activates the delete control on a Task, THE Todo_List SHALL remove the Task from the list and save the updated Task list to Local_Storage.
12. IF a task description submitted by the User exceeds 200 characters, THEN THE Todo_List SHALL reject the input and display an inline error message indicating the 200-character limit.
13. IF Local_Storage is unavailable or returns a read error on Dashboard load, THEN THE Todo_List SHALL display an empty Task list and display an inline error message indicating that Tasks could not be loaded.

---

### Requirement 5: Quick Links

**User Story:** As a User, I want to save and launch favourite website shortcuts from the Dashboard, so that I can reach frequently visited URLs in one click.

#### Acceptance Criteria

1. THE Quick_Links SHALL display all saved Links (up to a maximum of 50) retrieved from Local_Storage on Dashboard load.
2. WHEN the User provides a link label of 1–50 characters and a URL of 1–2048 characters and activates the add control, THE Quick_Links SHALL add a new Link with a unique identifier, the provided label, and the provided URL, provided the URL does not already exist in the saved Link list.
3. WHEN a Link is added, THE Quick_Links SHALL save the updated Link list to Local_Storage.
4. WHEN the User activates a Link button, THE Dashboard SHALL open the associated URL in a new browser tab.
5. WHEN the User activates the delete control on a Link, THE Quick_Links SHALL remove the Link and save the updated Link list to Local_Storage.
6. IF the User submits a Link URL that does not begin with `http://` or `https://`, THEN THE Quick_Links SHALL prepend `https://` to the URL before saving.
7. IF the User submits an empty label, a label exceeding 50 characters, an empty URL, a URL exceeding 2048 characters, or a duplicate URL that already exists in the saved Link list, THEN THE Quick_Links SHALL reject the input and display a validation message adjacent to the submission form that is visible without scrolling.
8. IF Local_Storage is unavailable when saving the Link list, THEN THE Quick_Links SHALL display an error message indicating the save failed and SHALL NOT update the displayed Link list.

---

### Requirement 6: Light / Dark Mode Toggle

**User Story:** As a User, I want to switch between light and dark colour schemes, so that I can use the Dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a toggle control that switches the Theme between `light` and `dark`.
2. WHEN the User activates the theme toggle, THE Dashboard SHALL apply the selected Theme to all visible UI elements within 100 milliseconds, without a page reload.
3. WHEN the User activates the theme toggle, THE Dashboard SHALL save the selected Theme to Local_Storage.
4. IF Local_Storage is unavailable, THEN THE Dashboard SHALL apply the selected Theme for the current session without persisting it, and shall not display an error to the User.
5. WHEN the Dashboard loads, THE Dashboard SHALL read the saved Theme from Local_Storage and apply it before the first paint, such that no UI element is rendered in a different Theme than the saved preference.
6. IF no Theme has been saved in Local_Storage, THEN THE Dashboard SHALL apply the Theme matching the User's operating system colour-scheme preference (`prefers-color-scheme`); if no operating system preference is detected, THE Dashboard SHALL apply the `light` Theme by default.

---

### Requirement 7: Responsive Layout and Performance

**User Story:** As a User, I want the Dashboard to load quickly and be usable across different screen sizes, so that I can use it on any device without a degraded experience.

#### Acceptance Criteria

1. THE Dashboard SHALL render without layout overflow or broken elements on viewports with a minimum width of 320px and a maximum width of 1920px.
2. THE Dashboard SHALL load and become interactive within 2 seconds when tested on a simulated network connection of 25 Mbps download speed, where "interactive" means all visible UI controls respond to user input without error.
3. THE Dashboard SHALL contain no external network dependencies at runtime (no CDN fonts, no remote scripts, no external API calls).
4. WHEN Local_Storage is unavailable, THE Dashboard SHALL remain functional and display an inline notice, positioned at the top of the Dashboard viewport, informing the User that data will not be persisted.

---

### Requirement 8: Code Structure and Maintainability

**User Story:** As a developer, I want the project to follow a clear file structure, so that the codebase is easy to read, maintain, and extend.

#### Acceptance Criteria

1. THE Dashboard SHALL be delivered as exactly one HTML file at the project root, one CSS file inside `css/`, and one JavaScript file inside `js/`.
2. THE Dashboard SHALL use no external JavaScript frameworks, CSS preprocessors, or build tools.
3. THE Dashboard's JavaScript file SHALL organise logic into named functions or modules, each preceded by a single-line or block comment describing its purpose, with at least one such comment per logical group of related operations.
4. THE Dashboard's CSS file SHALL use CSS custom properties (variables) for all colour values, such that changing only the custom property declarations in the `:root` block alters the corresponding colours throughout the Dashboard without modifying any other CSS rules.
