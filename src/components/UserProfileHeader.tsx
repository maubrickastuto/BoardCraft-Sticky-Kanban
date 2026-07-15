import { useState } from 'react';
import { User, Check, Edit2 } from 'lucide-react';
import { UserProfile, COLLABORATOR_COLORS } from '../types';
import { auth } from '../firebaseConfig';
import { updateProfile } from 'firebase/auth';

interface UserProfileHeaderProps {
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}

export default function UserProfileHeader({ profile, onProfileChange }: UserProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);

  const handleSave = () => {
    if (!editName.trim()) return;
    const updated = { ...profile, name: editName.trim() };
    localStorage.setItem('kanban_user_name', updated.name);
    onProfileChange(updated);
    setIsEditing(false);

    if (auth.currentUser) {
      updateProfile(auth.currentUser, { displayName: editName.trim() }).catch(() => {

      });
    }
  };

  const handleColorChange = (color: string) => {
    const updated = { ...profile, color };
    localStorage.setItem('kanban_user_color', color);
    onProfileChange(updated);
  };

  return (
    <div id="user-profile-header" className="flex items-center gap-3 px-3 py-2 bg-[#FAF8F5] dark:bg-[#1C1B17] rounded-lg border border-[#E5E2DA] dark:border-[#2D2A24] max-w-sm transition-colors duration-200">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner cursor-pointer transition-transform hover:scale-115"
        style={{ backgroundColor: profile.color }}
        title="Click to randomize your identity color"
        onClick={() => {
          const nextColor = COLLABORATOR_COLORS[(COLLABORATOR_COLORS.indexOf(profile.color) + 1) % COLLABORATOR_COLORS.length];
          handleColorChange(nextColor);
        }}
      >
        {profile.name ? profile.name.charAt(0).toUpperCase() : <User size={14} />}
      </div>

      <div className="flex-1 flex items-center justify-between min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1.5 w-full">
            <input
              id="edit-profile-name-input"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="text-xs font-medium text-[#1A1A1A] dark:text-[#FAF8F5] bg-white dark:bg-[#25231F] border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-1.5 py-0.5 focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5] w-full"
              maxLength={20}
              autoFocus
            />
            <button
              id="save-profile-name-button"
              onClick={handleSave}
              className="p-1 hover:bg-[#E5E2DA] dark:hover:bg-[#2D2A24] rounded text-emerald-700 dark:text-emerald-500 cursor-pointer"
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <div 
            className="flex items-center gap-1.5 group cursor-pointer max-w-full" 
            onClick={() => {
              setEditName(profile.name);
              setIsEditing(true);
            }}
          >
            <div className="text-xs text-[#5C5850] dark:text-[#BEB9AD] font-mono tracking-tight leading-none">As:</div>
            <div className="text-xs font-semibold text-[#1A1A1A] dark:text-[#FAF8F5] truncate leading-none max-w-[120px]" title={profile.name}>
              {profile.name}
            </div>
            <Edit2 size={10} className="text-[#8C887D] dark:text-[#7A756B] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    </div>
  );
}
