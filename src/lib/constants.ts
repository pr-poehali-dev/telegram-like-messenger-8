export const avatarColors = [
  "from-purple-500 to-pink-500",
  "from-cyan-500 to-blue-500",
  "from-pink-500 to-orange-500",
  "from-green-500 to-cyan-500",
  "from-orange-500 to-yellow-500",
  "from-blue-500 to-purple-500",
];

export interface Contact {
  id: number;
  name: string;
  avatar: string;
  status: "online" | "away" | "offline";
  lastSeen?: string;
  about?: string;
}
