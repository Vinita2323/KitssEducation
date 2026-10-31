import React, { useEffect, useState } from 'react';
import {
  Building2,
  GraduationCap,
  User,
  UserCheck,
  Mail,
  Phone,
  PhoneCall,
  MapPin,
  Calendar,
  Globe,
  FileText,
  UploadCloud,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  AlertCircle,
  X,
  Search,
  ChevronDown,
  Loader2,
  Info,
  Lock,
  FileCheck,
  Trash2,
  Compass,
  Edit3,
  Award,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { readOptions } from '../../services/collegeService';

// The original fields and layout share the current application state and workflow.
export function OriginalFranchiseFields({ form, setForm, step, policy, linked, setLinked, universities, colleges, onNext, onPrevious, logo, onLogo, onLogoError }) {
 const [taxonomy,setTaxonomy]=useState({state:[],designation:[],program:[]});
 useEffect(()=>{const c=new AbortController(); Promise.all(['state','designation','program'].map(async kind=>[kind,await readOptions('/taxonomies',{kind},c.signal)])).then(entries=>{if(!c.signal.aborted)setTaxonomy(Object.fromEntries(entries));}).catch(()=>{});return()=>c.abort();},[]);
 const INSTITUTION_TYPES=policy.institutionTypes, INDIAN_STATES=taxonomy.state.map(v=>v.label), DESIGNATIONS=taxonomy.designation.map(v=>v.label), DEFAULT_PROGRAM_OPTIONS=taxonomy.program.map(v=>v.label);
 const [uniDropdownOpen,setUniDropdownOpen]=useState(false),[colDropdownOpen,setColDropdownOpen]=useState(false),[uniSearch,setUniSearch]=useState(''),[colSearch,setColSearch]=useState(''),[showOtherInput,setShowOtherInput]=useState(false),[customCourseInput,setCustomCourseInput]=useState('');
 const [errors,setErrors]=useState({});
 const loadingUniversities=false,loadingColleges=false;
 const currentStep=step+1;
 const selectedUniversity=universities.find(v=>v.id===form.universityId),selectedCollege=colleges.find(v=>v.id===form.collegeId);
 const filteredUniversities=universities.filter(v=>(v.name+' '+v.shortName).toLowerCase().includes(uniSearch.toLowerCase()));
 const filteredColleges=colleges.filter(v=>v.name.toLowerCase().includes(colSearch.toLowerCase()));
 const setSelectedUniversity=v=>setForm(s=>({...s,universityId:v?.id||'',collegeId:''}));
 const setSelectedCollege=v=>setForm(s=>({...s,collegeId:v?.id||''}));
 const formData={institutionName:form.institution.name,institutionType:form.institution.type,yearEstablished:form.institution.yearEstablished,website:form.institution.website,institutionLogo:logo,programsOffered:form.programsOffered,contactPerson:form.contact.person,designation:form.contact.designation,email:form.contact.email,mobile:form.contact.mobile,alternateMobile:form.contact.alternateMobile,address:form.location.address,city:form.location.city,state:taxonomy.state.find(v=>v.id===form.location.stateId)?.label||'',pincode:form.location.pincode,googleMapsLocation:form.location.mapsUrl||''};
 const mapping={institutionName:['institution','name'],institutionType:['institution','type'],yearEstablished:['institution','yearEstablished'],website:['institution','website'],contactPerson:['contact','person'],designation:['contact','designation'],email:['contact','email'],mobile:['contact','mobile'],alternateMobile:['contact','alternateMobile'],address:['location','address'],city:['location','city'],pincode:['location','pincode'],googleMapsLocation:['location','mapsUrl']};
 const handleInputChange=(key,value)=>{if(key==='institutionLogo'){onLogo(null);return;}if(key==='programsOffered'){setForm(v=>({...v,programsOffered:value}));return;}if(key==='state'){setForm(v=>({...v,location:{...v.location,stateId:taxonomy.state.find(s=>s.label===value)?.id||''}}));return;}const [group,field]=mapping[key];setForm(v=>({...v,[group]:{...v[group],[field]:value}}));};
 const toggleProgram=p=>handleInputChange('programsOffered',form.programsOffered.includes(p)?form.programsOffered.filter(v=>v!==p):[...form.programsOffered,p]);
 const removeCustomCourse=p=>handleInputChange('programsOffered',form.programsOffered.filter(v=>v!==p));
 const handleAddCustomCourse=()=>{const value=customCourseInput.trim();if(value && value.length<=160 && !form.programsOffered.includes(value))handleInputChange('programsOffered',[...form.programsOffered,value]);setCustomCourseInput('');setShowOtherInput(false);};
 const handleLogoUpload=file=>{if(!['image/png','image/jpeg'].includes(file.type)||file.size>3*1024*1024){onLogoError('Choose a PNG or JPG logo up to 3 MB.');return;}onLogo({file,name:file.name,size:(file.size/1024).toFixed(1)+' KB',preview:URL.createObjectURL(file)});};
 const handleContinue=onNext,handleBackStep=onPrevious;
 return <>      {(<fieldset data-step="0" hidden={currentStep !== 1}>
        <motion.div
          key="step-1"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="p-3.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] flex items-center gap-2 text-xs text-[#0A1D3F] font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-[#FF8A00]" />
            <span>Step 1: Institution Details</span>
          </div>

          <div className="space-y-3.5">
            {/* Institution / College Name * */}
            <div>
              <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                Institution / College Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  aria-label="Institution name" required value={formData.institutionName}
                  onChange={(e) => handleInputChange("institutionName", e.target.value)}
                  placeholder="e.g. Apex Institute of Technology & Management"
                  className={`w-full pl-9 pr-3 py-2.5 text-xs bg-white border ${
                    errors.institutionName ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                  } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                />
              </div>
              {errors.institutionName && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.institutionName}</p>
              )}
            </div>

            {/* 2-Column Grid: Institution Type * & Year Established */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  Institution Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    aria-label="Institution type" required value={formData.institutionType}
                    onChange={(e) => handleInputChange("institutionType", e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition cursor-pointer appearance-none"
                  >
                    <option value="">Select institution type</option>{INSTITUTION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  Year Established <span className="text-[#64748B] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    required={policy.minimumYears > 0} aria-label="Year established" value={formData.yearEstablished}
                    onChange={(e) => handleInputChange("yearEstablished", e.target.value)}
                    placeholder="e.g. 2012"
                    min="1850"
                    max={new Date().getFullYear()}
                    className={`w-full pl-9 pr-3 py-2.5 text-xs bg-white border ${
                      errors.yearEstablished ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                    } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                  />
                </div>
                {errors.yearEstablished && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.yearEstablished}</p>
                )}
              </div>
            </div>

            {/* Official Website */}
            <div>
              <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                Official Website <span className="text-[#64748B] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  aria-label="Institution website" value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://institution.edu.in"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition"
                />
              </div>
            </div>

            {/* Institution Logo Upload (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                Institution Logo <span className="text-[#64748B] font-normal">(Optional — PNG/JPG up to 3MB)</span>
              </label>
              {formData.institutionLogo ? (
                <div className="flex items-center justify-between p-3 rounded-md bg-[#F8FAFC] border border-[#CBD5E1]">
                  <div className="flex items-center gap-3">
                    <img
                      src={formData.institutionLogo.preview}
                      alt="Logo Preview"
                      className="w-10 h-10 object-contain rounded-lg border border-[#E2E8F0] bg-white p-1"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#0A1D3F] block truncate max-w-[200px]">
                        {formData.institutionLogo.name}
                      </span>
                      <span className="text-[10px] text-[#64748B]">
                        {formData.institutionLogo.size}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange("institutionLogo", null)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Remove logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const file=e.dataTransfer.files?.[0];if(file)handleLogoUpload(file);}} className="border-2 border-dashed border-[#CBD5E1] hover:border-[#FF8A00] rounded-md p-3.5 flex flex-col items-center justify-center gap-1.5 bg-[#F8FAFC] hover:bg-[#FFF7ED]/30 cursor-pointer transition">
                  <UploadCloud className="w-6 h-6 text-[#64748B]" />
                  <span className="text-xs font-semibold text-[#0A1D3F]">
                    Click or drag & drop institution logo
                  </span>
                  <span className="text-[10px] text-[#64748B]">
                    Square format recommended (1:1 aspect ratio)
                  </span>
                  <input
                    type="file"
                    aria-label="Institution logo" accept="image/png,image/jpeg"
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={handleBackStep}
              className="py-2.5 px-4 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#0A1D3F] hover:bg-[#F8FAFC] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              aria-label="Next step" onClick={handleContinue}
              className="py-2.5 px-5 rounded-md bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <span>Continue to Affiliation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div></fieldset>)}

      {/* ========================================================
          STEP 2: AFFILIATION & FRANCHISE DETAILS
         ======================================================== */}
      {(<fieldset data-step="1" hidden={currentStep !== 2}>
        <motion.div
          key="step-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="p-3.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] flex items-center gap-2 text-xs text-[#0A1D3F] font-bold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4 text-[#FF8A00]" />
            <span>Step 2: University Affiliation & Programs Offered</span>
          </div>

          <div className="space-y-3.5">
            {policy.applicationMode === 'both' && <label className="block text-xs"><input type="checkbox" checked={linked} onChange={e => setLinked(e.target.checked)} /> Apply for an existing university and college</label>}
            {(linked || policy.applicationMode === 'linked') && <>
            {/* Field 1: Select University * */}
            <div>
              <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                Select University <span className="text-red-500">*</span>
              </label>

              {loadingUniversities ? (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-[#F8FAFC] border border-[#CBD5E1] text-xs text-[#64748B]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF8A00]" />
                  <span>Loading approved Universities...</span>
                </div>
              ) : (
                <div className="relative">
                  <div
                    role="button" tabIndex={0} aria-expanded={uniDropdownOpen} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setUniDropdownOpen(v=>!v);}}} aria-label="Select franchise university" onClick={() => setUniDropdownOpen(!uniDropdownOpen)}
                    className={`w-full p-2.5 rounded-md bg-white border ${
                      errors.university ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                    } flex items-center justify-between cursor-pointer hover:border-[#FF8A00] transition`}
                  >
                    {selectedUniversity ? (
                      <div className="flex items-center gap-2.5 truncate">
                        {selectedUniversity.logo ? (
                          <img
                            src={selectedUniversity.logo}
                            alt=""
                            className="w-6 h-6 rounded-md object-cover border border-[#E2E8F0] shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-md bg-[#0A1D3F] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            {selectedUniversity.shortName || "U"}
                          </div>
                        )}
                        <span className="text-xs font-bold text-[#0A1D3F] truncate">
                          {selectedUniversity.name} ({selectedUniversity.shortName})
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#94A3B8]">
                        -- Select Approved University --
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${uniDropdownOpen ? "rotate-180" : ""}`} />
                  </div>

                  {uniDropdownOpen && (
                    <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white rounded-md border border-[#CBD5E1] shadow-xl p-2 space-y-1.5 max-h-56 overflow-y-auto">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search University..."
                          value={uniSearch}
                          onChange={(e) => setUniSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00]"
                        />
                      </div>

                      <div className="space-y-1 pt-1">
                        {filteredUniversities.length === 0 ? (
                          <div className="p-2 text-center text-xs text-[#94A3B8]">
                            No universities found
                          </div>
                        ) : (
                          filteredUniversities.map((uni) => (
                            <div
                              key={uni._id || uni.id} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedUniversity(uni);setUniDropdownOpen(false);}}}
                              onClick={() => {
                                setSelectedUniversity(uni);
                                setUniDropdownOpen(false);
                                setUniSearch("");
                                if (errors.university) {
                                  setErrors((prev) => {
                                    const next = { ...prev };
                                    delete next.university;
                                    return next;
                                  });
                                }
                              }}
                              className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                                selectedUniversity?._id === uni._id || selectedUniversity?.id === uni.id
                                  ? "bg-[#FFF7ED] text-[#FF8A00] font-bold"
                                  : "hover:bg-[#F8FAFC] text-[#0A1D3F]"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-5 h-5 rounded bg-[#0A1D3F]/10 text-[#0A1D3F] flex items-center justify-center font-bold text-[9px] shrink-0">
                                  {uni.shortName || "U"}
                                </div>
                                <span className="truncate">{uni.name}</span>
                              </div>
                              <span className="text-[10px] text-[#64748B] uppercase font-semibold shrink-0 ml-2">
                                {uni.shortName}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {errors.university && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.university}</p>
              )}
            </div>

            {/* Field 2: Select College / Institute * (Dependent on University) */}
            <div>
              <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                Select College / Institute <span className="text-red-500">*</span>
              </label>

              {!selectedUniversity ? (
                <div className="p-3 rounded-md bg-gray-50 border border-dashed border-[#CBD5E1] text-xs text-[#64748B] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Please select a University above first to view authorized colleges.</span>
                </div>
              ) : loadingColleges ? (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-[#F8FAFC] border border-[#CBD5E1] text-xs text-[#64748B]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF8A00]" />
                  <span>Loading affiliated colleges for {selectedUniversity.shortName}...</span>
                </div>
              ) : (
                <div className="relative">
                  <div
                    role="button" tabIndex={0} aria-expanded={colDropdownOpen} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setColDropdownOpen(v=>!v);}}} aria-label="Select franchise college" onClick={() => setColDropdownOpen(!colDropdownOpen)}
                    className={`w-full p-2.5 rounded-md bg-white border ${
                      errors.college ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                    } flex items-center justify-between cursor-pointer hover:border-[#FF8A00] transition`}
                  >
                    {selectedCollege ? (
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className="w-4 h-4 text-[#FF8A00] shrink-0" />
                        <span className="text-xs font-bold text-[#0A1D3F] truncate">
                          {selectedCollege.name}
                        </span>
                        <span className="text-[10px] text-[#64748B] shrink-0">
                          ({selectedCollege.city}, {selectedCollege.state})
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#94A3B8]">
                        -- Select College under {selectedUniversity.shortName} --
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${colDropdownOpen ? "rotate-180" : ""}`} />
                  </div>

                  {colDropdownOpen && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white rounded-md border border-[#CBD5E1] shadow-xl p-2 space-y-1.5 max-h-56 overflow-y-auto">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search college name or city..."
                          value={colSearch}
                          onChange={(e) => setColSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00]"
                        />
                      </div>

                      <div className="space-y-1 pt-1">
                        {filteredColleges.length === 0 ? (
                          <div className="p-2 text-center text-xs text-[#94A3B8]">
                            No affiliated colleges found under this university
                          </div>
                        ) : (
                          filteredColleges.map((col) => (
                            <div
                              key={col._id || col.id} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedCollege(col);setColDropdownOpen(false);}}}
                              onClick={() => {
                                setSelectedCollege(col);
                                setColDropdownOpen(false);
                                setColSearch("");
                                if (errors.college) {
                                  setErrors((prev) => {
                                    const next = { ...prev };
                                    delete next.college;
                                    return next;
                                  });
                                }
                              }}
                              className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                                selectedCollege?._id === col._id || selectedCollege?.id === col.id
                                  ? "bg-[#FFF7ED] text-[#FF8A00] font-bold"
                                  : "hover:bg-[#F8FAFC] text-[#0A1D3F]"
                              }`}
                            >
                              <div className="truncate">
                                <span className="font-semibold block truncate">{col.name}</span>
                                <span className="text-[10px] text-[#64748B]">
                                  {col.city}, {col.state} • Code: {col.code || "N/A"}
                                </span>
                              </div>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF8A00] shrink-0 ml-2" />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {errors.college && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.college}</p>
              )}
            </div>

            </>}
            {/* Programs / Courses Offered (Multi-Select Chips + Custom "+ Other" Course Adder) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#0A1D3F]">
                  Programs / Courses Offered <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-[#64748B] font-medium">
                  {formData.programsOffered.length} selected
                </span>
              </div>

              {/* Programs Pill Selector */}
              <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {/* Standard predefined course pills */}
                  {DEFAULT_PROGRAM_OPTIONS.map((prog) => {
                    const isSelected = formData.programsOffered.includes(prog);
                    return (
                      <button
                        key={prog}
                        type="button"
                        onClick={() => toggleProgram(prog)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#0A1D3F] text-white shadow-2xs"
                            : "bg-white text-[#475569] border border-[#CBD5E1] hover:border-[#FF8A00]"
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3 text-[#FF8A00]" /> : null}
                        <span>{prog}</span>
                      </button>
                    );
                  })}

                  {/* Custom user-added courses */}
                  {formData.programsOffered
                    .filter((p) => !DEFAULT_PROGRAM_OPTIONS.includes(p))
                    .map((customProg) => (
                      <span
                        key={customProg}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FF8A00] text-white flex items-center gap-1.5 shadow-2xs"
                      >
                        <Check className="w-3 h-3 text-white" />
                        <span>{customProg}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCustomCourse(customProg);
                          }}
                          className="hover:bg-black/20 rounded-full p-0.5 transition cursor-pointer"
                          title="Remove this course"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                  {/* "+ Other" Button toggle */}
                  <button
                    type="button"
                    onClick={() => setShowOtherInput(!showOtherInput)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      showOtherInput
                        ? "bg-[#FFF7ED] text-[#FF8A00] border border-[#FF8A00]"
                        : "bg-white text-[#FF8A00] border border-dashed border-[#FF8A00] hover:bg-[#FFF7ED]/50"
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Other Course</span>
                  </button>
                </div>

                {/* Inline input for custom "+ Other" course */}
                {showOtherInput && (
                  <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
                    <span className="text-[11px] font-semibold text-[#0A1D3F] block">
                      Add Custom / Other Course or Program Name:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customCourseInput}
                        onChange={(e) => setCustomCourseInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomCourse();
                          }
                        }}
                        placeholder="e.g. Hotel Management, Aviation & Logistics, Data Science..."
                        className="flex-1 px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCourse}
                        disabled={!customCourseInput.trim()}
                        className="py-2 px-3.5 rounded-md bg-[#0A1D3F] hover:bg-[#133C8B] disabled:opacity-50 text-white text-xs font-semibold shrink-0 transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowOtherInput(false);
                          setCustomCourseInput("");
                        }}
                        className="p-2 text-[#64748B] hover:text-[#0A1D3F] rounded-lg hover:bg-gray-100 transition cursor-pointer"
                        title="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {errors.programs && (
                <p className="text-[11px] text-red-500 font-medium">{errors.programs}</p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={handleBackStep}
              className="py-2.5 px-4 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#0A1D3F] hover:bg-[#F8FAFC] transition cursor-pointer"
            >
              Back
            </button>
            <button
              disabled={(linked || policy.applicationMode === 'linked') && (loadingColleges || !selectedCollege)}
              type="button"
              aria-label="Next step" onClick={handleContinue}
              className="py-2.5 px-5 rounded-md bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <span>{loadingColleges ? 'Loading colleges…' : 'Continue to Contact'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div></fieldset>)}

      {/* ========================================================
          STEP 3: AUTHORIZED CONTACT
         ======================================================== */}
      {(<fieldset data-step="2" hidden={currentStep !== 3}>
        <motion.div
          key="step-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="p-3.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] flex items-center gap-2 text-xs text-[#0A1D3F] font-bold uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-[#FF8A00]" />
            <span>Step 3: Authorized Representative Details</span>
          </div>

          <div className="space-y-3.5">
            {/* 2-Column: Authorized Person Name * & Designation * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  Authorized Person Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    aria-label="Contact person" required value={formData.contactPerson}
                    onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className={`w-full pl-9 pr-3 py-2.5 text-xs bg-white border ${
                      errors.contactPerson ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                    } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                  />
                </div>
                {errors.contactPerson && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.contactPerson}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  Official Designation <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    aria-label="Designation" value={formData.designation}
                    onChange={(e) => handleInputChange("designation", e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition cursor-pointer appearance-none"
                  >
                    <option value="">Select designation</option>{DESIGNATIONS.map((desig) => (
                      <option key={desig} value={desig}>
                        {desig}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Official Email Address * */}
            <div>
              <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                Official Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  aria-label="Contact email" required value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="director@institution.edu.in"
                  className={`w-full pl-9 pr-3 py-2.5 text-xs bg-white border ${
                    errors.email ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                  } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.email}</p>
              )}
            </div>

            {/* 2-Column: Mobile Number * & Alternate Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    pattern="[+0-9 ()-]{10,32}" aria-label="Contact mobile" required value={formData.mobile}
                    onChange={(e) => handleInputChange("mobile", e.target.value)}
                    placeholder="10-digit mobile"
                    maxLength={14}
                    className={`w-full pl-9 pr-3 py-2.5 text-xs bg-white border ${
                      errors.mobile ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                    } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                  />
                </div>
                {errors.mobile && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.mobile}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  Alternate Contact <span className="text-[#64748B] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    pattern="[+0-9 ()-]{10,32}" aria-label="Alternate mobile" value={formData.alternateMobile}
                    onChange={(e) => handleInputChange("alternateMobile", e.target.value)}
                    placeholder="Landline or mobile"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={handleBackStep}
              className="py-2.5 px-4 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#0A1D3F] hover:bg-[#F8FAFC] transition cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              aria-label="Next step" onClick={handleContinue}
              className="py-2.5 px-5 rounded-md bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <span>Continue to Campus Location</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div></fieldset>)}

      {/* ========================================================
          STEP 4: CAMPUS LOCATION
         ======================================================== */}
      {(<fieldset data-step="3" hidden={currentStep !== 4}>
        <motion.div
          key="step-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="p-3.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] flex items-center gap-2 text-xs text-[#0A1D3F] font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-[#FF8A00]" />
            <span>Step 4: Campus Location & Physical Address</span>
          </div>

          <div className="space-y-3.5">
            {/* Complete Campus Address * */}
            <div>
              <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                Complete Campus Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  aria-label="Address" required value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Building Name, Sector / Area, Road, Landmark..."
                  className={`w-full p-2.5 text-xs bg-white border ${
                    errors.address ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                  } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                />
              </div>
              {errors.address && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.address}</p>
              )}
            </div>

            {/* 3-Column: City *, State *, Pincode * */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  aria-label="City" required value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="e.g. Pune"
                  className={`w-full px-3 py-2.5 text-xs bg-white border ${
                    errors.city ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                  } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                />
                {errors.city && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    aria-label="State" value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition cursor-pointer appearance-none"
                  >
                    <option value="">Select state</option>{INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  pattern="[0-9]{6}" aria-label="Pincode" required value={formData.pincode}
                  onChange={(e) => handleInputChange("pincode", e.target.value)}
                  placeholder="6-digit PIN"
                  maxLength={6}
                  className={`w-full px-3 py-2.5 text-xs bg-white border ${
                    errors.pincode ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                  } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                />
                {errors.pincode && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.pincode}</p>
                )}
              </div>
            </div>

            {/* Optional Campus Google Maps Location */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#0A1D3F]">
                  Campus Google Maps Location <span className="text-[#64748B] font-normal">(Optional)</span>
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Compass className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  aria-label="Campus Google Maps location" value={formData.googleMapsLocation}
                  onChange={(e) => handleInputChange("googleMapsLocation", e.target.value)}
                  placeholder="e.g. https://maps.google.com/?q=... "
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition"
                />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={handleBackStep}
              className="py-2.5 px-4 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#0A1D3F] hover:bg-[#F8FAFC] transition cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              aria-label="Next step" onClick={handleContinue}
              className="py-2.5 px-5 rounded-md bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <span>Continue to Documents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div></fieldset>)}

      {/* ========================================================
          STEP 5: DOCUMENTS & VERIFICATION
         ======================================================== */}
</>;
}
