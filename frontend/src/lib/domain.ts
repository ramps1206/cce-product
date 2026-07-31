// Shared domain constants/helpers matching the original CCE app.

export const STD_NAMES: Record<string, string> = {
  '1': 'पहिली', '2': 'दुसरी', '3': 'तिसरी', '4': 'चौथी',
  '5': 'पाचवी', '6': 'सहावी', '7': 'सातवी', '8': 'आठवी',
}

/** Class label, e.g. "इ. पहिली - अ" (matches original clsName). */
export function clsName(c: any): string {
  if (!c) return '—'
  const std = STD_NAMES[String(c.std)] || c.std || ''
  return `इ. ${std}${c.div ? ' - ' + c.div : ''}`.trim()
}

export const DIVISIONS = ['अ', 'ब', 'क', 'ड', 'इ', 'फ']

export const QUALIFICATIONS = ['BA.D.Ed', 'MA.D.Ed', 'BA.B.Ed', 'MA.B.Ed']
export const SUBJECTS = ['सर्व', 'मराठी', 'इंग्रजी', 'गणित', 'विज्ञान', 'समाजशास्त्र', 'हिंदी']

export const DISABILITY_TYPES = [
  'अंधत्व (Blindness)', 'अल्प दृष्टी (Low Vision)', 'कुष्ठरोग निवारित (Leprosy Cured)', 'कर्णबधिरत्व (Deaf)',
  'ऐकण्यात कमजोरी (Hard of Hearing)', 'चालण्या-फिरण्यातील अपंगत्व (Locomotor Disability)', 'बुटकेपणा (Dwarfism)',
  'बौद्धिक अक्षमता (Intellectual Disability)', 'मानसिक आजार (Mental Illness)', 'स्वमग्नता (Autism Spectrum Disorder)',
  'सेरेब्रल पाल्सी (Cerebral Palsy)', 'स्नायुंची दुर्बलता (Muscular Dystrophy)', 'चेतासंस्थेचे तीव्र आजार (Chronic Neurological Conditions)',
  'विशिष्ट अध्ययन अक्षमता (Specific Learning Disability)', 'मल्टिपल स्क्लेरोसिस (Multiple Sclerosis)',
  'वाचा व भाषा अक्षमता (Speech and Language Disability)', 'थॅलेसेमिया (Thalassemia)', 'हिमोफिलिया (Hemophilia)',
  'सिकल सेल आजार (Sickle Cell Disease)', 'बहुविकलांगत्व (Multiple Disabilities)', 'आम्ल हल्ला पीडित (Acid Attack Victim)',
  "पार्किन्सन्स आजार (Parkinson's Disease)", 'इतर (Other)',
]

/** Remaining service until retirement at 58 (from date of birth). */
export function remainingService(dob?: string): string {
  if (!dob) return ''
  const retire = new Date(dob)
  if (isNaN(retire.getTime())) return ''
  retire.setFullYear(retire.getFullYear() + 58)
  const now = new Date()
  let months = (retire.getFullYear() - now.getFullYear()) * 12 + (retire.getMonth() - now.getMonth())
  if (months <= 0) return 'निवृत्त'
  return `${Math.floor(months / 12)} वर्षे ${months % 12} महिने`
}
