/**
 * Photographies réelles issues d'Unsplash (licence Unsplash gratuite — https://unsplash.com/license).
 *
 * Politique : aucune image générée par IA ni rendu 3D. Chaque photo ci-dessous a été vérifiée :
 * publiée sur Unsplash avant 2022 (antérieure aux générateurs d'images grand public) et
 * prise par un photographe ou une institution identifiée (ex. National Cancer Institute, CDC).
 * Ne pas ajouter d'image publiée après 2022 sans vérifier les données EXIF de l'appareil photo.
 */
const U = (id: string, w = 1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PHOTOS = {
  // Algérie
  maqam: { id: "photo-1580913709631-8de3edebfd2e", alt: "Le Maqam Echahid (Mémorial du Martyr) à Alger" },
  algiersBay: { id: "photo-1535585538107-e457d37fbde5", alt: "Ville côtière algérienne au crépuscule" },
  algiersSunset: { id: "photo-1642215104060-86e252b2cb69", alt: "Alger au coucher du soleil, vue sur la baie" },
  // Études et enseignement
  studentLaptop: { id: "photo-1576091160550-2173dba999ef", alt: "Étudiant en médecine travaillant sur un ordinateur avec un stéthoscope" },
  studentBooks: { id: "photo-1571260899304-425eee4c7efc", alt: "Étudiante en médecine portant ses manuels" },
  lectureCrowd: { id: "photo-1544531585-f14f463149ec", alt: "Amphithéâtre rempli d'étudiants" },
  bookStethoscope: { id: "photo-1652787544912-137c7f92f99b", alt: "Livre de médecine et stéthoscope" },
  lab: { id: "photo-1527613426441-4da17471b66d", alt: "Scientifique au laboratoire" },
  // Clinique
  heartStethoscope: { id: "photo-1624727828489-a1e03b79bba8", alt: "Soignante tenant un stéthoscope en forme de cœur" },
  doctorPortrait: { id: "photo-1584432810601-6c7f27d2362b", alt: "Médecin avec un stéthoscope" },
  consultation: { id: "photo-1631217868264-e5b90bb7e133", alt: "Médecin en consultation avec une patiente" },
  bedside: { id: "photo-1581056771107-24ca5f033842", alt: "Médecin au chevet d'une patiente hospitalisée" },
  bedside2: { id: "photo-1584516150909-c43483ee7932", alt: "Médecin parlant à une patiente dans son lit d'hôpital" },
  pediatric: { id: "photo-1632053002928-1919605ee6f7", alt: "Jeune enfant examiné par un médecin" },
  babyExam: { id: "photo-1632052999447-e542d08d4f7d", alt: "Soignante auscultant un nourrisson" },
  medicalTeam: { id: "photo-1504813184591-01572f98c85f", alt: "Équipe médicale au travail" },
  hallwayDoctors: { id: "photo-1516841273335-e39b37888115", alt: "Médecins marchant dans un couloir d'hôpital" },
  hospitalLobby: { id: "photo-1519494026892-80bbd2d6fd0d", alt: "Accueil d'un hôpital" },
  dermDropper: { id: "photo-1552256031-811fa8f0a7b1", alt: "Application d'un soin cutané au compte-gouttes" },
  // Urgences et bloc
  surgeonsLights: { id: "photo-1551601651-2a8555f1a136", alt: "Chirurgiens opérant sous les scialytiques" },
  surgeonsLooking: { id: "photo-1579684385127-1ef15d508118", alt: "Chirurgiens sous la lumière du bloc opératoire" },
  surgeryTeam: { id: "photo-1579684453423-f84349ef60b0", alt: "Équipe chirurgicale en pleine intervention" },
  operatingRoom: { id: "photo-1504439468489-c8920d796a29", alt: "Bloc opératoire équipé" },
  erSurgery: { id: "photo-1512102438733-bfa4ed29aef7", alt: "Équipe en salle d'urgence" },
  ivStand: { id: "photo-1516574187841-cb9cc2ca948b", alt: "Perfusion sur pied à sérum" },
  // Examens
  mri: { id: "photo-1631563019676-dade0dbdb8fc", alt: "Coupes d'IRM cérébrale" },
  vitalsMonitor: { id: "photo-1513224502586-d1e602410265", alt: "Moniteur affichant les constantes vitales" },
  heartModel: { id: "photo-1460672985063-6764ac8b9c74", alt: "Modèle anatomique de cœur" },
  // Patients alités (salle de consultation). Photos postérieures à 2022 vérifiées via EXIF :
  // bedMan — engin akyurt, Fujifilm GFX100 II (2024) ; bedChild — @stachmann, Canon EOS RP (2023).
  bedMan: { id: "photo-1712232416341-b821c23c415a", alt: "Patient allongé dans un lit d'hôpital, brassard à tension au bras" },
  bedWoman: { id: "photo-1550791871-0bcd47c97881", alt: "Patiente allongée dans un lit d'hôpital, en blouse" },
  bedChild: { id: "photo-1672928499660-58693df7af84", alt: "Jeune enfant alité sous une couverture" },
  // Spécialités ajoutées (vérifiées : publiées avant 2022).
  eyeChart: { id: "photo-1576210117723-cd06449a467d", alt: "Échelle d'acuité visuelle au mur d'un cabinet" },
  pregnantBelly: { id: "photo-1457342813143-a1ae27448a82", alt: "Ventre d'une femme enceinte, de profil" },
  eyeClose: { id: "photo-1570564273767-80f85f826d7f", alt: "Œil d'un patient en gros plan : paupières, conjonctive, iris et pupille" },
  ultrasoundCouple: { id: "photo-1528218635780-5952720c9729", alt: "Couple tenant une image d'échographie de grossesse" },
  xrayReview: { id: "photo-1631563019701-efcf403bc5fe", alt: "Médecin commentant des radiographies thoraciques (National Cancer Institute)" },
} as const;

export type PhotoKey = keyof typeof PHOTOS;
export const photoUrl = (k: PhotoKey, w?: number) => U(PHOTOS[k].id, w);

export const SPECIALTY_PHOTO: Record<string, PhotoKey> = {
  cardiology: "heartModel",
  neurology: "mri",
  pediatrics: "pediatric",
  emergency: "erSurgery",
  internal: "bedside",
  dermatology: "dermDropper",
  general: "consultation",
  ophthalmology: "eyeChart",
  gynecology: "ultrasoundCouple",
  pulmonology: "xrayReview",
};

/** English alt text for each photo (screen readers). */
export const PHOTO_ALT_EN: Record<PhotoKey, string> = {
  maqam: "The Maqam Echahid (Martyrs' Memorial) in Algiers",
  algiersBay: "Algerian coastal city at dusk",
  algiersSunset: "Algiers at sunset, looking over the bay",
  studentLaptop: "Medical student working on a laptop with a stethoscope",
  studentBooks: "Medical student carrying her textbooks",
  lectureCrowd: "Lecture hall full of students",
  bookStethoscope: "Medical book and stethoscope",
  lab: "Scientist in the laboratory",
  heartStethoscope: "Caregiver holding a heart-shaped stethoscope",
  doctorPortrait: "Doctor with a stethoscope",
  consultation: "Doctor in consultation with a patient",
  bedside: "Doctor at the bedside of a hospitalised patient",
  bedside2: "Doctor talking to a patient in her hospital bed",
  pediatric: "Young child being examined by a doctor",
  babyExam: "Caregiver listening to a baby's chest",
  medicalTeam: "Medical team at work",
  hallwayDoctors: "Doctors walking along a hospital corridor",
  hospitalLobby: "Hospital reception",
  dermDropper: "Skin treatment applied with a dropper",
  surgeonsLights: "Surgeons operating under surgical lights",
  surgeonsLooking: "Surgeons under the operating-theatre lights",
  surgeryTeam: "Surgical team during an operation",
  operatingRoom: "Equipped operating theatre",
  erSurgery: "Team in the emergency room",
  ivStand: "IV drip on a stand",
  mri: "Brain MRI slices",
  vitalsMonitor: "Monitor showing vital signs",
  heartModel: "Anatomical heart model",
  bedMan: "Patient lying in a hospital bed with a blood-pressure cuff on his arm",
  bedWoman: "Patient lying in a hospital bed, in a gown",
  bedChild: "Young child in bed under a blanket",
  eyeChart: "Visual acuity chart on a clinic wall",
  pregnantBelly: "Pregnant woman's belly in profile",
  eyeClose: "Close-up of a patient's eye: eyelids, conjunctiva, iris and pupil",
  ultrasoundCouple: "Couple holding a pregnancy ultrasound image",
  xrayReview: "Doctor discussing chest X-rays (National Cancer Institute)",
};
