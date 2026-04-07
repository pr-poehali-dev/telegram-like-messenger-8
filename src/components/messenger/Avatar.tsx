import { avatarColors } from "@/lib/constants";
import type { Contact } from "@/lib/constants";

interface AvatarProps {
  contact: Contact;
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
}

const sizes = {
  sm: "w-8 h-8 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-16 h-16 text-lg",
};

const statusDotSizes = {
  sm: "w-2 h-2 -bottom-0.5 -right-0.5",
  md: "w-2.5 h-2.5 -bottom-0.5 -right-0.5",
  lg: "w-3 h-3 bottom-0 right-0",
  xl: "w-3.5 h-3.5 bottom-0 right-0",
};

export default function Avatar({ contact, size = "md", showStatus = false }: AvatarProps) {
  const colorIdx = contact.id % avatarColors.length;

  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${avatarColors[colorIdx]} flex items-center justify-center font-bold text-white`}>
        {contact.avatar}
      </div>
      {showStatus && (
        <span className={`absolute ${statusDotSizes[size]} rounded-full border-2 border-[hsl(var(--background))] ${
          contact.status === "online" ? "bg-green-400" :
          contact.status === "away" ? "bg-yellow-400" : "bg-gray-500"
        }`} />
      )}
    </div>
  );
}