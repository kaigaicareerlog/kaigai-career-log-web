/**
 * Modal utility functions for handling modal interactions
 */

export interface ModalElements {
  modal: HTMLElement | null;
  closeBtn: HTMLElement | null;
}

/**
 * Get modal elements by ID
 */
export function getModalElements(modalId: string): ModalElements {
  return {
    modal: document.getElementById(modalId),
    closeBtn: document.getElementById(`${modalId}-close`),
  };
}

/**
 * Show a modal
 */
export function showModal(modal: HTMLElement | null): void {
  if (!modal) return;
  modal.classList.add("active");
}

/**
 * Hide a modal
 */
export function hideModal(modal: HTMLElement | null): void {
  if (!modal) return;
  modal.classList.remove("active");
}

/**
 * Toggle a modal
 */
export function toggleModal(modal: HTMLElement | null): void {
  if (!modal) return;
  if (modal.classList.contains("active")) {
    hideModal(modal);
  } else {
    showModal(modal);
  }
}

/**
 * Setup keyboard shortcut for modal
 * @param triggerKey - The key to press with Tab (e.g., 'e', 'l')
 * @param callback - Function to call when shortcut is triggered
 * @returns Cleanup function to remove listeners
 */
export function setupModalKeyboardShortcut(
  triggerKey: string,
  callback: () => void
): () => void {
  let tabPressed = false;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Track Tab key state
    if (e.key === "Tab") {
      tabPressed = true;
    }

    // Check if trigger key is pressed while Tab is held
    if (
      (e.key === triggerKey.toLowerCase() ||
        e.key === triggerKey.toUpperCase()) &&
      tabPressed
    ) {
      e.preventDefault();
      callback();
    }

    // Close modal on Escape
    if (e.key === "Escape") {
      callback();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      tabPressed = false;
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  // Return cleanup function
  return () => {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
  };
}

/**
 * Setup modal close on outside click
 */
export function setupModalOutsideClick(
  modal: HTMLElement | null,
  onClose: () => void
): void {
  modal?.addEventListener("click", (e: MouseEvent) => {
    if (e.target === modal) {
      onClose();
    }
  });
}

/**
 * Copy text to clipboard and show feedback
 */
export async function copyToClipboard(
  text: string,
  feedbackElement?: HTMLElement | null
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);

    // Show feedback if element provided
    if (feedbackElement) {
      feedbackElement.classList.add("show");
      setTimeout(() => {
        feedbackElement.classList.remove("show");
      }, 2000);
    }

    return true;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
}
