import { AppError } from '../../utils/AppError.js';
import { object, text, invalid } from '../publishing/validation.js';

export const registrationFields = {
  study: 'studentName dob age fatherName motherName email whatsappNo callingNo address state district city pincode applyCourseName applyInstituteName',
  tuition: 'studentName fatherName motherName dob studentClass studyBoard stateName district pincode address schoolName schoolAddress homeAddress contactNo whatsappNo guardianContactNo emailId',
  teacher: 'title fullName dob age studyLanguage instituteName startDate endDate isContinuing coachingCourse instituteAddress instituteContact contactNumber whatsappNumber email coachingExperience specializationNotes',
  'coaching-profile': 'name phone email dob gender state city board class',
};
export const documentRequirements = { study: ['courseCertificate', 'aadharCard', 'passportPhoto'], tuition: ['aadharCard', 'passportPhoto', 'classIdCard'], teacher: ['passportPhoto', 'experienceDoc', 'aadharCard'], 'coaching-profile': [] };
export function applicantInput(kind, applicant, user) {
  if (!registrationFields[kind]) throw invalid('Unsupported registration type');
  object(applicant, registrationFields[kind].split(' '));
  const result = {};
  for (const [key, value] of Object.entries(applicant)) {
    if (key === 'isContinuing') { if (typeof value !== 'boolean') throw invalid('Invalid continuing status'); result[key] = value; }
    else result[key] = text(value, 2000);
  }
  for (const field of ['email', 'emailId']) if (result[field] && result[field].trim().toLowerCase() !== user.emailNormalized) throw invalid('Applicant email must match the verified signed-in account');
  return result;
}
export const registrationBlocked = () => new AppError(409, 'REGISTRATION_POLICY_PENDING', 'Submission and payment are blocked pending document privacy, eligibility and activation policies. Drafts grant no account roles or paid access.');
