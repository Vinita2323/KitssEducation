import { RegistrationDraftControls } from '../../components/auth/RegistrationDraftControls';
import { useOriginalRegistration } from '../../components/auth/useOriginalRegistration';
import React, { useCallback, useState } from "react";
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
} from "lucide-react";
import { SearchableSelect } from "../../components/common/SearchableSelect";

const inputClass = "w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] transition";
const labelClass = "block text-xs font-bold text-[#0A1D3F] uppercase tracking-wider";
const errorText = message => message ? <p className="text-[11px] text-red-500 font-medium">{message}</p> : null;

export const CourseRegistrationPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    gender: "",
    state: "",
    city: "",
    board: "",
    class: "",
  });
  const [errors, setErrors] = useState({});
  const set = (key, value) => setFormData(current => ({ ...current, [key]: value }));

  // Same workflow as the other registration forms: registration policy, the verified account's email,
  // and State / Board / Class choices from the admin Dropdown settings.
  const workflow = useOriginalRegistration("coaching-profile", formData, setFormData, setErrors);
  const states = workflow.choices("state", formData.state);
  const boards = workflow.choices("board", formData.board);
  const classes = workflow.choices("class", formData.class);

  const validate = useCallback(() => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Full Name is required";
    if (!formData.phone.trim()) errs.phone = "Mobile Number is required";
    else if (!/^\+?[0-9\s-]{10,14}$/.test(formData.phone.trim())) errs.phone = "Please enter a valid 10-digit mobile number";
    if (!formData.email.trim()) errs.email = "Email Address is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Please enter a valid email address";
    if (!formData.dob) errs.dob = "Date of Birth is required";
    if (!formData.city.trim()) errs.city = "City is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formData]);

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF8A00]/10 text-[#FF8A00] font-bold text-xs uppercase tracking-wider">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student Coaching Registration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0A1D3F] tracking-tight">
          Join KITSS Online Coaching
        </h1>
        <p className="text-xs sm:text-sm text-[#667085] max-w-md mx-auto">
          Fill in your details, save them, and submit your coaching profile for review.
        </p>
      </div>

      {workflow.config && !workflow.enabled && (
        <p role="status" className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          Coaching registration is not open yet. You can save your details as a draft now and submit them once it opens.
        </p>
      )}

      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-6 sm:p-8 card-shadow space-y-5">
        {/* Row 1: Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="coaching-name" className={labelClass}>Full Name *</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
            <input id="coaching-name" type="text" placeholder="e.g. Rohan Sharma" value={formData.name}
              onChange={e => set("name", e.target.value)} className={inputClass} />
          </div>
          {errorText(errors.name)}
        </div>

        {/* Row 2: Mobile & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="coaching-phone" className={labelClass}>Mobile Number *</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
              <input id="coaching-phone" type="tel" placeholder="+91 98765 43210" value={formData.phone}
                onChange={e => set("phone", e.target.value)} className={inputClass} />
            </div>
            {errorText(errors.phone)}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="coaching-email" className={labelClass}>Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
              {/* The application must use the verified signed-in email, so it is filled in and fixed when known. */}
              <input id="coaching-email" type="email" placeholder="student@example.com" value={formData.email}
                readOnly={Boolean(workflow.user?.emailVerified)} aria-describedby={workflow.user?.emailVerified ? "coaching-email-note" : undefined}
                onChange={e => set("email", e.target.value)} className={inputClass} />
            </div>
            {workflow.user?.emailVerified && <p id="coaching-email-note" className="text-[11px] text-[#667085]">Uses your signed-in account email.</p>}
            {errorText(errors.email)}
          </div>
        </div>

        {/* Row 3: Date of Birth & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="coaching-dob" className={labelClass}>Date of Birth *</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
              <input id="coaching-dob" type="date" value={formData.dob}
                onChange={e => set("dob", e.target.value)} className={inputClass} />
            </div>
            {errorText(errors.dob)}
          </div>

          <div className="space-y-1.5">
            <span className={labelClass}>Gender</span>
            <SearchableSelect options={["Male", "Female", "Other"]} value={formData.gender} ariaLabel="Gender"
              onChange={val => set("gender", val)} searchable={false} placeholder="Select Gender" />
          </div>
        </div>

        {/* Row 4: State & City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className={labelClass}>State</span>
            <SearchableSelect options={states} value={formData.state} ariaLabel="State"
              onChange={val => set("state", val)} placeholder="Select State" searchPlaceholder="Search State..." />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="coaching-city" className={labelClass}>City *</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
              <input id="coaching-city" type="text" placeholder="e.g. Bhopal, Indore, Delhi" value={formData.city}
                onChange={e => set("city", e.target.value)} className={inputClass} />
            </div>
            {errorText(errors.city)}
          </div>
        </div>

        {/* Row 5: Board & Class */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className={labelClass}>Education Board</span>
            <SearchableSelect options={boards} value={formData.board} ariaLabel="Education Board"
              onChange={val => set("board", val)} placeholder="Select Board" searchPlaceholder="Search Board..." />
          </div>

          <div className="space-y-1.5">
            <span className={labelClass}>Class / Grade</span>
            <SearchableSelect options={classes} value={formData.class} ariaLabel="Class / Grade"
              onChange={val => set("class", val)} placeholder="Select Class" searchPlaceholder="Search Class..." />
          </div>
        </div>

        {/* Save, review status and submit: the shared registration workflow used by every application form. */}
        <div className="pt-4 border-t border-[#E6E8EC]">
          <RegistrationDraftControls kind="coaching-profile" formData={formData} setFormData={setFormData}
            onApplicationChange={workflow.setApplication} beforeSubmit={validate} />
        </div>
      </div>
    </div>
  );
};
