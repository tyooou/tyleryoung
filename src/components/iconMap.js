import {
  User,
  Briefcase,
  Book,
  Users,
  Mail,
  History,
  Keyboard,
  Folder,
} from "lucide-react";

export const ICON_MAP = {
  user: User,
  briefcase: Briefcase,
  book: Book,
  users: Users,
  mail: Mail,
  history: History,
  keyboard: Keyboard,
  folder: Folder,
};

export function getIcon(key) {
  return ICON_MAP[key] ?? Folder;
}
