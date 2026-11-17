import { msg } from "./index";

/**
 * Error messages the API sends for sign-in and account flows. Listing them here gets them
 * translated, so pages can show `t(error.message)` to the user.
 */
export const API_MESSAGES = [
  msg("Invalid credentials"),
  msg("This account is not active"),
  msg("A user with this email already exists"),
  msg("This reset link is invalid or has expired"),
  msg("Too many requests. Please try again later."),
  msg("Authentication is required"),
  msg("Invalid or expired token"),
  msg("School subscription is inactive"),
  msg("Your account is not linked to a school"),
  msg("You do not have permission for this action"),
  msg("Something went wrong"),
  msg("Saved on this device. It will be sent when you are back online."),
];
