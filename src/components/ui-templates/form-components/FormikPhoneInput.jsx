import React, { useState, useEffect } from "react";
import { useField, useFormikContext } from "formik";
import Select from "react-select";

// Common country codes
const countryCodes = [
    { value: "+255", label: "🇹🇿 (+255)", code: "TZ" },
    { value: "+1", label: "🇺🇸 (+1)", code: "US" },
    { value: "+44", label: "🇬🇧 (+44)", code: "GB" },
    { value: "+254", label: "🇰🇪 (+254)", code: "KE" },
    { value: "+256", label: "🇺🇬 (+256)", code: "UG" },
    { value: "+250", label: "🇷🇼 (+250)", code: "RW" },
    { value: "+27", label: "🇿🇦 (+27)", code: "ZA" },
    { value: "+234", label: "🇳🇬(+234)", code: "NG" },
    { value: "+233", label: "🇬🇭 (+233)", code: "GH" },
    { value: "+91", label: "🇮🇳 (+91)", code: "IN" },
    { value: "+86", label: "🇨🇳 (+86)", code: "CN" },
    { value: "+81", label: "🇯🇵 (+81)", code: "JP" },
    { value: "+49", label: "🇩🇪 (+49)", code: "DE" },
    { value: "+33", label: "🇫🇷 (+33)", code: "FR" },
    { value: "+39", label: "🇮🇹 (+39)", code: "IT" },
    { value: "+34", label: "🇪🇸 (+34)", code: "ES" },
    { value: "+61", label: "🇦🇺 (+61)", code: "AU" },
    { value: "+971", label: "🇦🇪 (+971)", code: "AE" },
    { value: "+966", label: "🇸🇦 (+966)", code: "SA" },
    { value: "+20", label: "🇪🇬 (+20)", code: "EG" },
];

const FormikPhoneInput = ({ name, label, placeholder, className = "form-control" }) => {
    const [field, meta, helpers] = useField(name);
    const { setFieldValue } = useFormikContext();
    const [countryCode, setCountryCode] = useState("+255");
    const [phoneNumber, setPhoneNumber] = useState("");

    // Parse existing phone number on mount or when field value changes
    useEffect(() => {
        if (field.value) {
            const value = field.value.toString();
            // Try to extract country code from the value
            const matchedCode = countryCodes.find(code => value.startsWith(code.value));
            if (matchedCode) {
                setCountryCode(matchedCode.value);
                setPhoneNumber(value.replace(matchedCode.value, "").trim());
            } else {
                // Default to Tanzania if no match
                setCountryCode("+255");
                setPhoneNumber(value);
            }
        }
    }, [field.value]);

    // Update Formik field when country code or phone number changes
    useEffect(() => {
        const fullPhone = phoneNumber ? `${countryCode}${phoneNumber}` : "";
        helpers.setValue(fullPhone);
    }, [countryCode, phoneNumber]);

    const handleCountryChange = (selectedOption) => {
        setCountryCode(selectedOption.value);
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, ""); // Only allow digits
        setPhoneNumber(value);
    };



    return (
        <div>
            {label && (
                <label htmlFor={name} className="form-label">
                    {label}
                </label>
            )}
            <div className="input-group">
                <div style={{ width: "100px", flexShrink: 0 }}>
                    <Select
                        value={countryCodes.find(code => code.value === countryCode)}
                        onChange={handleCountryChange}
                        options={countryCodes}
                        styles={customStyles}
                        isSearchable
                        placeholder="Select country"
                        formatOptionLabel={({ label }) => (
                            <div style={{ fontSize: "13px" }}>{label}</div>
                        )}
                    />
                </div>
                <input
                    type="tel"
                    className={`${className} ${meta.error && meta.touched ? "is-invalid" : ""}`}
                    placeholder={placeholder || "Enter phone number"}
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    maxLength={15}
                />
            </div>
            {meta.error && meta.touched && (
                <div className="text-danger small mt-1">{meta.error}</div>
            )}
        </div>
    );
};

export default FormikPhoneInput;

