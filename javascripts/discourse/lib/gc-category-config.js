// Single source of truth for subcategory data.
// To add a new category: add one entry here + one setting in settings.yml.

export const CATEGORY_CONFIG = {
  "mengenal-bilangan": {
    icon: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="3" y="26" font-size="18" font-weight="700" fill="#7C3AED" font-family="sans-serif">1 2 3</text>
    </svg>`,
    palette: { bg: "#F5F0FF", border: "#C4B5FD", iconBg: "#EDE9FE" },
    settingKey: "mengenal_bilangan_icon",
    gradient: { start: "#4C1D95", end: "#8B5CF6", settingKeyStart: "mengenal_bilangan_gradient_start", settingKeyEnd: "mengenal_bilangan_gradient_end" },
    group: "math",
  },
  "bakalkubagi": {
    icon: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="4" y="16" font-size="13" fill="#0D9488" font-family="sans-serif">+ ×</text>
      <text x="4" y="32" font-size="13" fill="#0D9488" font-family="sans-serif">÷ −</text>
    </svg>`,
    palette: { bg: "#F0FDFA", border: "#99F6E4", iconBg: "#CCFBF1" },
    settingKey: "bakalkubagi_icon",
    gradient: { start: "#065F46", end: "#10B981", settingKeyStart: "bakalkubagi_gradient_start", settingKeyEnd: "bakalkubagi_gradient_end" },
    group: "math",
  },
  "bilangan-bulat": {
    icon: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="2" y="18" font-size="11" fill="#D97706" font-family="sans-serif">0→</text>
      <text x="2" y="32" font-size="11" fill="#D97706" font-family="sans-serif">←0</text>
    </svg>`,
    palette: { bg: "#FFFBEB", border: "#FDE68A", iconBg: "#FEF3C7" },
    settingKey: "bilangan_bulat_icon",
    gradient: { start: "#78350F", end: "#F59E0B", settingKeyStart: "bilangan_bulat_gradient_start", settingKeyEnd: "bilangan_bulat_gradient_end" },
    group: "math",
  },
  "pede": {
    icon: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="14" stroke="#EC4899" stroke-width="2" fill="none"/>
      <line x1="20" y1="6"  x2="8"  y2="30" stroke="#EC4899" stroke-width="2"/>
      <line x1="20" y1="6"  x2="32" y2="30" stroke="#EC4899" stroke-width="2"/>
      <line x1="10" y1="22" x2="30" y2="22" stroke="#EC4899" stroke-width="2"/>
    </svg>`,
    palette: { bg: "#FFF0F8", border: "#FBCFE8", iconBg: "#FCE7F3" },
    settingKey: "pede_icon",
    gradient: { start: "#9D174D", end: "#EC4899", settingKeyStart: "pede_gradient_start", settingKeyEnd: "pede_gradient_end" },
    group: "math",
  },
  "ruang-guru": {
    icon: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="10" width="28" height="20" rx="4" stroke="#6366F1" stroke-width="2" fill="none"/>
      <path d="M13 24 Q20 18 27 24" stroke="#6366F1" stroke-width="2" fill="none"/>
      <circle cx="20" cy="19" r="3" fill="#6366F1"/>
    </svg>`,
    palette: { bg: "#EEF2FF", border: "#C7D2FE", iconBg: "#E0E7FF" },
    settingKey: "ruang_guru_icon",
    gradient: { start: "#312E81", end: "#6366F1", settingKeyStart: "ruang_guru_gradient_start", settingKeyEnd: "ruang_guru_gradient_end" },
    group: "general",
  },
  "topik-santai": {
    icon: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 28 Q12 14 20 14 Q28 14 28 22 Q28 30 20 30 L14 34 Z" stroke="#F97316" stroke-width="2" fill="none"/>
      <line x1="18" y1="8" x2="18" y2="11" stroke="#F97316" stroke-width="2"/>
      <line x1="22" y1="8" x2="22" y2="11" stroke="#F97316" stroke-width="2"/>
    </svg>`,
    palette: { bg: "#FFF7ED", border: "#FED7AA", iconBg: "#FFEDD5" },
    settingKey: "topik_santai_icon",
    gradient: { start: "#7C2D12", end: "#F97316", settingKeyStart: "topik_santai_gradient_start", settingKeyEnd: "topik_santai_gradient_end" },
    group: "general",
  },
  default: {
    icon: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="24" height="24" rx="4" stroke="#94A3B8" stroke-width="2" fill="none"/>
      <line x1="14" y1="16" x2="26" y2="16" stroke="#94A3B8" stroke-width="2"/>
      <line x1="14" y1="20" x2="26" y2="20" stroke="#94A3B8" stroke-width="2"/>
      <line x1="14" y1="24" x2="22" y2="24" stroke="#94A3B8" stroke-width="2"/>
    </svg>`,
    palette: { bg: "#F8FAFC", border: "#E2E8F0", iconBg: "#F1F5F9" },
    settingKey: null,
    group: "general",
  },
};

// Display order and labels for category groups.
export const CATEGORY_GROUPS = [
  { id: "math",    label: "Konsep Dasar Matematika" },
  { id: "general", label: "Diskusi Umum" },
];

// URL path that triggers the custom layout: /c/<parent>/<category>/
export const TARGET_PATH = { parent: "general", category: "forum" };

export const ACTIVE_CLASS = "gc-community-active";
export const SUBCATEGORY_ACTIVE_CLASS = "gc-subcategory-active";
