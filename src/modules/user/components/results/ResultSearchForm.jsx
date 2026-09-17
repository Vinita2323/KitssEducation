import React, { useState, useEffect } from "react";
import { Search, Calendar, User, Hash, AlertCircle, Sparkles, Building2, BookOpen } from "lucide-react";
import { PrimaryButton } from "../common/PrimaryButton";
import { DEMO_PRESETS } from "../../data/mockBoards";

/**
 * ResultSearchForm
 * Configuration-driven dynamic form engine.
 * Renders appropriate fields dynamically based on the selected board schema.
 */
export const ResultSearchForm = ({
  boardConfig,
  resultType = "school",
  initialValues = {},
  onSubmit,
  loading = false,
  onChangeBoard
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Initialize form data when boardConfig changes, merging defaults with any existing values
  useEffect(() => {
    if (!boardConfig || !boardConfig.fields) return;

    const initial = {};
    boardConfig.fields.forEach((field) => {
      if (initialValues[field.id] !== undefined) {
        initial[field.id] = initialValues[field.id];
      } else if (field.defaultValue !== undefined) {
        initial[field.id] = field.defaultValue;
      } else {
        initial[field.id] = "";
      }
    });

    setFormData(initial);
    setErrors({});
    setTouched({});
  }, [boardConfig]);

  if (!boardConfig) return null;

  const handleChange = (fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));

    // Clear error on change if field had one
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleBlur = (fieldId) => {
    setTouched((prev) => ({ ...prev, [fieldId]: true }));
    validateField(fieldId, formData[fieldId]);
  };

  const validateField = (fieldId, val) => {
    const field = boardConfig.fields.find((f) => f.id === fieldId);
    if (!field) return true;

    const strVal = (val || "").toString().trim();

    if (field.required && !strVal) {
      setErrors((prev) => ({ ...prev, [fieldId]: `${field.label} is required.` }));
      return false;
    }

    if (field.validation) {
      const { pattern, minLength, message } = field.validation;
      if (minLength && strVal.length < minLength) {
        setErrors((prev) => ({
          ...prev,
          [fieldId]: message || `Must be at least ${minLength} characters.`
        }));
        return false;
      }
      if (pattern && !new RegExp(pattern).test(strVal)) {
        setErrors((prev) => ({
          ...prev,
          [fieldId]: message || `Invalid format for ${field.label}.`
        }));
        return false;
      }
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mark all as touched & validate
    let hasError = false;
    const newErrors = {};

    boardConfig.fields.forEach((field) => {
      const val = (formData[field.id] || "").toString().trim();
      if (field.required && !val) {
        newErrors[field.id] = `${field.label} is required.`;
        hasError = true;
      } else if (field.validation) {
        const { pattern, minLength, message } = field.validation;
        if (minLength && val.length < minLength) {
          newErrors[field.id] = message || `Must be at least ${minLength} characters.`;
          hasError = true;
        } else if (pattern && !new RegExp(pattern).test(val)) {
          newErrors[field.id] = message || `Invalid format for ${field.label}.`;
          hasError = true;
        }
      }
    });

    setErrors(newErrors);
    setTouched(
      boardConfig.fields.reduce((acc, f) => ({ ...acc, [f.id]: true }), {})
    );

    if (hasError) return;

    // Submit with all search parameters
    onSubmit({
      type: resultType,
      boardId: boardConfig.id,
      boardName: boardConfig.fullName || boardConfig.name,
      ...formData
    });
  };

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      rollNumber: preset.rollNumber,
      dob: preset.dob || prev.dob || "2009-08-15",
      motherName: preset.motherName || prev.motherName || ""
    }));
    setErrors({});
  };

  // Filter demo presets matching current result type and board
  const relevantPresets = DEMO_PRESETS.filter(
    (p) => p.type === resultType && (p.boardId === boardConfig.id || p.rollNumber === "999999")
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-5 shadow-xs space-y-3.5">
      {/* Selected Board Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {boardConfig.code || "BD"}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Step 2: Examination Details
            </span>
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {boardConfig.fullName || boardConfig.name}
            </h3>
          </div>
        </div>

        {onChangeBoard && (
          <button
            type="button"
            onClick={onChangeBoard}
            className="self-start sm:self-center text-xs font-medium text-slate-700 hover:text-slate-950 border border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            Change Board
          </button>
        )}
      </div>

      {/* Demo Credentials Quick-Fill Chips */}
      {relevantPresets.length > 0 && (
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/70 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Quick Test Credentials (Click to Auto-fill):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {relevantPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 hover:border-slate-400 transition active:scale-95 shadow-2xs cursor-pointer"
              >
                {preset.label}: <strong className="font-mono font-semibold">{preset.rollNumber}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Form based on Board Configuration */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {boardConfig.fields.map((field) => {
            const fieldError = touched[field.id] && errors[field.id];
            const isSpanFull = field.gridSpan === "full";

            return (
              <div
                key={field.id}
                className={isSpanFull ? "sm:col-span-2 space-y-1" : "space-y-1"}
              >
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={field.id}
                    className="block text-xs font-semibold text-slate-800"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  {field.helperText && !fieldError && (
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      {field.helperText}
                    </span>
                  )}
                </div>

                {/* Field Input Rendering */}
                {field.type === "select" ? (
                  <div className="relative">
                    <select
                      id={field.id}
                      value={formData[field.id] ?? ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      onBlur={() => handleBlur(field.id)}
                      className={`w-full px-3 py-2 bg-slate-50/70 border rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                        fieldError
                          ? "border-red-400 focus:ring-red-100 bg-red-50/20"
                          : "border-slate-200/80 focus:ring-slate-100 focus:border-slate-400"
                      }`}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                ) : field.type === "date" ? (
                  <div className="relative">
                    <input
                      id={field.id}
                      type="date"
                      value={formData[field.id] ?? ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      onBlur={() => handleBlur(field.id)}
                      className={`w-full px-3 py-2 bg-slate-50/70 border rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                        fieldError
                          ? "border-red-400 focus:ring-red-100 bg-red-50/20"
                          : "border-slate-200/80 focus:ring-slate-100 focus:border-slate-400"
                      }`}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      id={field.id}
                      type={field.type || "text"}
                      placeholder={field.placeholder || ""}
                      value={formData[field.id] ?? ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      onBlur={() => handleBlur(field.id)}
                      className={`w-full px-3 py-2 bg-slate-50/70 border rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        field.id.toLowerCase().includes("roll") ? "font-mono font-bold" : ""
                      } ${
                        fieldError
                          ? "border-red-400 focus:ring-red-100 bg-red-50/20"
                          : "border-slate-200/80 focus:ring-slate-100 focus:border-slate-400"
                      }`}
                    />
                  </div>
                )}

                {/* Validation Error Text */}
                {fieldError ? (
                  <div className="flex items-center gap-1 text-[11px] font-medium text-red-600 pt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldError}</span>
                  </div>
                ) : field.helperText ? (
                  <p className="text-[10px] text-slate-400 sm:hidden">
                    {field.helperText}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Form Submission CTA */}
        <div className="pt-3 border-t border-slate-100">
          <PrimaryButton
            type="submit"
            variant="navy"
            size="md"
            fullWidth
            loading={loading}
            icon={Search}
          >
            View Result
          </PrimaryButton>
          <p className="text-center text-[10px] text-slate-400 mt-1.5">
            🔒 Official verification portal • Authenticated marks statement
          </p>
        </div>
      </form>
    </div>
  );
};
