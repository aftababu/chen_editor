import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  generateChenCodeFromText,
  generateChenCodeFromImage,
} from "../services/aiService";
import { parseChenCode } from "../lib/chenParser";
import AuthButton from "./AuthButton";

export default function AiGeneratePanel({ isOpen, onClose, onInsertCode }) {
  const { user } = useAuth();
  const dialogRef = useRef(null);

  // Tabs: "text" | "image"
  const [activeTab, setActiveTab] = useState("text");
  const [textInput, setTextInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // Loading, Success & Error States
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  // --- Dialog Lifecycle Control ---
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Click outside dialog backdrop fallback (Safari)
  const handleDialogClick = (event) => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;
    if (event.target !== dialog) return;

    const rect = dialog.getBoundingClientRect();
    const isDialogContent =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;

    if (!isDialogContent) {
      onClose();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size must not exceed 5MB.");
      return;
    }

    setImageFile(file);
    setError("");
    setValidationErrors([]);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || isGenerating) return;

    setIsGenerating(true);
    setError("");
    setValidationErrors([]);
    setGeneratedCode("");

    try {
      const idToken = await user.getIdToken();
      const result = await generateChenCodeFromText(textInput, idToken);
      const parsed = parseChenCode(result.chenCode);

      setGeneratedCode(result.chenCode);

      if (parsed.errors && parsed.errors.length > 0) {
        setValidationErrors(parsed.errors);
      } else {
        onInsertCode(result.chenCode);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Failed to generate Chen Code.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || isGenerating) return;

    setIsGenerating(true);
    setError("");
    setValidationErrors([]);
    setGeneratedCode("");

    try {
      const idToken = await user.getIdToken();
      const result = await generateChenCodeFromImage(imageFile, idToken);
      const parsed = parseChenCode(result.chenCode);

      setGeneratedCode(result.chenCode);

      if (parsed.errors && parsed.errors.length > 0) {
        setValidationErrors(parsed.errors);
      } else {
        onInsertCode(result.chenCode);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Failed to generate Chen Code.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Re-validates the temporary code block edited inside the modal
  const handleTempCodeChange = (newCode) => {
    setGeneratedCode(newCode);
    const parsed = parseChenCode(newCode);
    setValidationErrors(parsed.errors || []);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleDialogClick}
      closedby="any"
      aria-labelledby="modal-title"
      className="relative left-1/2 transform -translate-x-1/2 top-1/2  -translate-y-1/2 w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-0 border border-slate-200 dark:border-slate-700 shadow-2xl backdrop:bg-slate-900/50 dark:backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm outline-none overflow-hidden transition-colors duration-300"
    >
      {/* MODAL HEADER */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center transition-colors">
        <h3
          id="modal-title"
          className="text-lg font-bold text-slate-800 dark:text-white flex items-center space-x-2"
        >
          <span>✨</span>
          <span>Chen Code AI Generator</span>
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
          aria-label="Close modal"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* MODAL BODY */}
      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
        {!user ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl border border-slate-700">
              🔒
            </div>
            <div>
              <h4 className="font-bold text-white text-md">
                Authentication Required
              </h4>
              <p className="text-slate-400 text-xs mt-1 max-w-sm">
                You must be signed in with Google to generate ER diagrams using
                the Gemini AI system.
              </p>
            </div>
            <AuthButton />
          </div>
        ) : (
          <>
            {/* TABS CONTAINER */}
            <div className="flex space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("text");
                  setError("");
                  setValidationErrors([]);
                  setGeneratedCode("");
                }}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "text"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                Text Requirements
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("image");
                  setError("");
                  setValidationErrors([]);
                  setGeneratedCode("");
                }}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "image"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                Upload Sketch/Image
              </button>
            </div>

            {/* TAB CONTENT: TEXT */}
            {activeTab === "text" && (
              <form onSubmit={handleTextSubmit} className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <label
                    htmlFor="requirements-input"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Database Requirements
                  </label>
                  <textarea
                    id="requirements-input"
                    className="w-full h-32 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 p-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none text-sm resize-none transition-colors"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Example: We have a Student entity with PK RollNo and name. Student takes multiple Courses (PK CourseID, title). Student and Course are in an M:N relationship 'enrolls'..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isGenerating || !textInput.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Generating ER Model...</span>
                    </>
                  ) : (
                    <span>Generate Chen Code</span>
                  )}
                </button>
              </form>
            )}

            {/* TAB CONTENT: IMAGE */}
            {activeTab === "image" && (
              <form onSubmit={handleImageSubmit} className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Upload Sketch or Diagram Image
                  </span>
                  <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 rounded-lg p-6 flex flex-col items-center justify-center transition-colors bg-slate-50 dark:bg-slate-950">
                    <input
                      type="file"
                      id="image-file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {imagePreview ? (
                      <div className="flex flex-col items-center space-y-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-28 rounded border border-slate-700 object-contain"
                        />
                        <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          {imageFile.name}
                        </span>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <span className="text-2xl">📸</span>
                        <div className="text-xs font-semibold text-slate-300">
                          Click or drag image file here
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Supports PNG, JPG (Max 5MB)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isGenerating || !imageFile}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Analyzing Diagram...</span>
                    </>
                  ) : (
                    <span>Generate from Image</span>
                  )}
                </button>
              </form>
            )}

            {/* ERROR & VALIDATION STATES */}
            {error && (
              <div className="bg-red-950/40 border border-red-800/40 p-3 rounded-lg text-red-400 text-xs">
                <strong>API Error:</strong> {error}
              </div>
            )}

            {/* IF VALIDATION ERRORS EXIST */}
            {generatedCode && validationErrors.length > 0 && (
              <div className="space-y-3 bg-yellow-950/20 border border-yellow-800/30 p-4 rounded-xl">
                <div className="flex items-start space-x-2 text-yellow-400 text-xs">
                  <span>⚠️</span>
                  <div>
                    <h5 className="font-bold">
                      Model validation failed with errors
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      The AI generated syntactically incorrect code. You can fix
                      it below or insert anyway to debug on the canvas.
                    </p>
                  </div>
                </div>

                <textarea
                  className="w-full h-32 bg-slate-950 text-yellow-400 p-2.5 rounded-lg border border-yellow-900/40 font-mono text-xs outline-none"
                  value={generatedCode}
                  onChange={(e) => handleTempCodeChange(e.target.value)}
                />

                <div className="text-[10px] font-mono text-red-400 space-y-1">
                  {validationErrors.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      onInsertCode(generatedCode);
                      onClose();
                    }}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-1.5 rounded text-xs font-semibold transition-colors"
                  >
                    Insert Anyway
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedCode("");
                      setValidationErrors([]);
                    }}
                    className="px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 py-1.5 rounded text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </dialog>
  );
}
