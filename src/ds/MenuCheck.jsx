import { Icon } from "./Icon";

/**
 * The checkmark at the end of a chosen menu row (GUU admin .menuCheck): 16px, pushed to the end,
 * in the menu check colour (#444, #999 in dark). Chosen rows have no fill; this is the only mark.
 */
export function MenuCheck() {
  return <Icon name="check" size={16} className="fr-check" />;
}
