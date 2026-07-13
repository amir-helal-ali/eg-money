'use client'

// SVG payment method icons with brand colors
// Each icon is a self-contained SVG component

type IconProps = { className?: string }

export function InstaPayIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill="#E6007E"/>
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="Arial">InstaPay</text>
    </svg>
  )
}

export function VodafoneIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill="#E60000"/>
      <circle cx="24" cy="24" r="12" fill="none" stroke="white" strokeWidth="3"/>
      <path d="M24 12 A12 12 0 0 1 36 24 L24 24 Z" fill="white"/>
    </svg>
  )
}

export function OrangeIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill="#FF7900"/>
      <text x="24" y="31" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="Arial">€</text>
    </svg>
  )
}

export function EtisalatIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill="#76BC21"/>
      <circle cx="24" cy="20" r="8" fill="none" stroke="white" strokeWidth="2.5"/>
      <path d="M16 28 Q24 36 32 28" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

export function NBEIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill="#0066B3"/>
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="Arial">NBE</text>
    </svg>
  )
}

export function BanqueMisrIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill="#005BAC"/>
      <rect x="12" y="18" width="24" height="3" fill="#FFD700"/>
      <rect x="12" y="24" width="24" height="3" fill="#FFD700"/>
      <rect x="12" y="30" width="24" height="3" fill="#FFD700"/>
      <path d="M10 16 L24 8 L38 16" fill="none" stroke="white" strokeWidth="2"/>
    </svg>
  )
}

export function CIBIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill="#003366"/>
      <text x="24" y="30" textAnchor="middle" fill="#00AEEF" fontSize="12" fontWeight="700" fontFamily="Arial">CIB</text>
    </svg>
  )
}

export function CairoBankIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill="#1A237E"/>
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Arial">CAIRO</text>
    </svg>
  )
}

export function EmiratesNBDIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill="#D32F2F"/>
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="Arial">Emirates</text>
    </svg>
  )
}

export function AlexBankIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill="#003D7A"/>
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Arial">Alex</text>
    </svg>
  )
}

export function MashreqIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill="#E30613"/>
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="Arial">Mashreq</text>
    </svg>
  )
}

export function BankTransferIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill="#455A64"/>
      <path d="M14 20 L34 20 M14 20 L18 16 M14 20 L18 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M34 28 L14 28 M34 28 L30 24 M34 28 L30 32" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Map of all payment method icons
export const PAYMENT_ICONS: { key: string; Icon: any; label: string; labelAr: string }[] = [
  { key: 'InstaPay', Icon: InstaPayIcon, label: 'InstaPay', labelAr: 'إنستا باي' },
  { key: 'Vodafone', Icon: VodafoneIcon, label: 'Vodafone', labelAr: 'فودافون' },
  { key: 'Orange', Icon: OrangeIcon, label: 'Orange', labelAr: 'أورنج' },
  { key: 'Etisalat', Icon: EtisalatIcon, label: 'Etisalat', labelAr: 'اتصالات' },
  { key: 'NBE', Icon: NBEIcon, label: 'NBE', labelAr: 'البنك الأهلي' },
  { key: 'Misr', Icon: BanqueMisrIcon, label: 'Misr', labelAr: 'بنك مصر' },
  { key: 'CIB', Icon: CIBIcon, label: 'CIB', labelAr: 'CIB' },
  { key: 'Cairo', Icon: CairoBankIcon, label: 'Cairo', labelAr: 'بنك القاهرة' },
  { key: 'Emirates', Icon: EmiratesNBDIcon, label: 'Emirates', labelAr: 'الإمارات' },
  { key: 'Alex', Icon: AlexBankIcon, label: 'Alex', labelAr: 'بنك الإسكندرية' },
  { key: 'Mashreq', Icon: MashreqIcon, label: 'Mashreq', labelAr: 'المشرق' },
  { key: 'Bank', Icon: BankTransferIcon, label: 'Bank', labelAr: 'تحويل بنكي' },
]
