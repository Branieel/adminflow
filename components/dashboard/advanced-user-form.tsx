"use client";

import {
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";

interface AdvancedUserFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  department: string;
  jobTitle: string;
  phone: string;
  notes: string;
  accessJustification: string;
}

const initialFormData: FormData = {
  name: "",
  email: "",
  role: "User",
  status: "Active",
  department: "",
  jobTitle: "",
  phone: "",
  notes: "",
  accessJustification: "",
};

const STORAGE_KEY =
  "adminflow-new-user-draft";

function getInitialFormData(): FormData {
  if (typeof window === "undefined") {
    return {
      ...initialFormData,
    };
  }

  try {
    const savedDraft =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!savedDraft) {
      return {
        ...initialFormData,
      };
    }

    const parsedDraft =
      JSON.parse(savedDraft);

    return {
      ...initialFormData,
      ...parsedDraft,
    };
  } catch {
    try {
      localStorage.removeItem(
        STORAGE_KEY
      );
    } catch {
      // Ignore localStorage errors.
    }

    return {
      ...initialFormData,
    };
  }
}

function hasStoredDraft(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      localStorage.getItem(
        STORAGE_KEY
      ) !== null
    );
  } catch {
    return false;
  }
}

export default function AdvancedUserForm({
  onCancel,
  onSuccess,
}: AdvancedUserFormProps) {
  const [step, setStep] =
    useState(1);

  const [formData, setFormData] =
    useState<FormData>(
      getInitialFormData
    );

  const [errors, setErrors] =
    useState<
      Record<string, string>
    >({});

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    draftRestored,
    setDraftRestored,
  ] = useState(
    hasStoredDraft
  );

  /*
   * AUTOSAVE DRAFT
   *
   * Save entered information while
   * the user is completing the form.
   *
   * If the form becomes empty,
   * remove the previous draft.
   */
  useEffect(() => {
    const timeout =
      setTimeout(() => {
        try {
          const hasData =
            formData.name.trim() !== "" ||
            formData.email.trim() !== "" ||
            formData.department.trim() !== "" ||
            formData.jobTitle.trim() !== "" ||
            formData.phone.trim() !== "" ||
            formData.notes.trim() !== "" ||
            formData.accessJustification.trim() !== "";

          if (hasData) {
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(
                formData
              )
            );
          } else {
            localStorage.removeItem(
              STORAGE_KEY
            );
          }
        } catch {
          // Ignore localStorage errors.
        }
      }, 300);

    return () => {
      clearTimeout(timeout);
    };
  }, [formData]);

  /*
   * UPDATE FIELD
   */
  const updateField = <
    K extends keyof FormData,
  >(
    field: K,
    value: FormData[K]
  ) => {
    setFormData(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

    setErrors(
      (current) => ({
        ...current,
        [field]: "",
      })
    );

    setErrorMessage("");
    setSuccessMessage("");
  };

  /*
   * VALIDATION
   */
  const validateStep = (
    currentStep: number
  ) => {
    const newErrors: Record<
      string,
      string
    > = {};

    /*
     * STEP 1
     */
    if (currentStep === 1) {
      const cleanName =
        formData.name.trim();

      const cleanEmail =
        formData.email.trim();

      if (!cleanName) {
        newErrors.name =
          "Name is required.";
      } else if (
        cleanName.length < 2
      ) {
        newErrors.name =
          "Name must contain at least 2 characters.";
      } else if (
        cleanName.length > 100
      ) {
        newErrors.name =
          "Name must not exceed 100 characters.";
      } else if (
        !/^[\p{L}\p{M}.' -]+$/u.test(
          cleanName
        )
      ) {
        newErrors.name =
          "Name can only contain letters, spaces, apostrophes, periods, and hyphens.";
      }

      if (!cleanEmail) {
        newErrors.email =
          "Email is required.";
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          cleanEmail
        )
      ) {
        newErrors.email =
          "Please enter a valid email address.";
      }

      if (!formData.role) {
        newErrors.role =
          "Role is required.";
      }

      if (!formData.status) {
        newErrors.status =
          "Status is required.";
      }
    }

    /*
     * STEP 2
     */
    if (currentStep === 2) {
      if (
        !formData.department.trim()
      ) {
        newErrors.department =
          "Department is required.";
      }

      if (
        !formData.jobTitle.trim()
      ) {
        newErrors.jobTitle =
          "Job title is required.";
      }

      if (
        formData.role ===
          "Administrator" &&
        !formData.accessJustification.trim()
      ) {
        newErrors.accessJustification =
          "Access justification is required for Administrator accounts.";
      }
    }

    setErrors(newErrors);

    return (
      Object.keys(
        newErrors
      ).length === 0
    );
  };

  /*
   * CONTINUE / REVIEW
   *
   * Step 1 -> Step 2
   * Step 2 -> Step 3
   *
   * NO USER IS CREATED HERE.
   */
  const handleNext = () => {
    if (isSubmitting) {
      return;
    }

    if (!validateStep(step)) {
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
    }
  };

  /*
   * BACK
   *
   * Allows the information to be
   * corrected before account creation.
   */
  const handleBack = () => {
    if (isSubmitting) {
      return;
    }

    setErrors({});
    setErrorMessage("");
    setSuccessMessage("");

    setStep((current) =>
      Math.max(
        current - 1,
        1
      )
    );
  };

  /*
   * ENTER KEY PROTECTION
   *
   * Step 1:
   * Enter -> Continue
   *
   * Step 2:
   * Enter -> Review
   *
   * Step 3:
   * Enter -> Nothing
   *
   * This prevents accidental
   * user creation.
   */
  const handleKeyDown = (
    event: KeyboardEvent<HTMLFormElement>
  ) => {
    if (event.key !== "Enter") {
      return;
    }

    const target =
      event.target as HTMLElement;

    /*
     * Keep normal Enter behavior
     * inside textareas.
     */
    if (
      target.tagName ===
      "TEXTAREA"
    ) {
      return;
    }

    /*
     * Never allow browser default
     * form submission.
     */
    event.preventDefault();

    /*
     * Only continue on Steps
     * 1 and 2.
     */
    if (step < 3) {
      handleNext();
    }
  };

  /*
   * CREATE USER
   *
   * This is the ONLY function
   * that sends POST /api/users.
   */
  const handleCreateUser =
    async () => {
      /*
       * User must be on the
       * Review step.
       */
      if (step !== 3) {
        return;
      }

      /*
       * Prevent duplicate requests.
       */
      if (isSubmitting) {
        return;
      }

      /*
       * Validate Account again.
       */
      if (!validateStep(1)) {
        setStep(1);
        return;
      }

      /*
       * Validate Details again.
       */
      if (!validateStep(2)) {
        setStep(2);
        return;
      }

      try {
        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        const response =
          await fetch(
            "/api/users",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                name:
                  formData.name.trim(),

                email:
                  formData.email
                    .trim()
                    .toLowerCase(),

                role:
                  formData.role,

                status:
                  formData.status,

                department:
                  formData.department.trim(),

                jobTitle:
                  formData.jobTitle.trim(),

                phone:
                  formData.phone.trim(),

                notes:
                  formData.notes.trim(),

                accessJustification:
                  formData.accessJustification.trim(),
              }),
            }
          );

        let result: {
          success?: boolean;
          message?: string;
        };

        /*
         * Read API response.
         */
        try {
          result =
            await response.json();
        } catch {
          throw new Error(
            `The server returned an invalid response (${response.status}).`
          );
        }

        /*
         * Handle API/database error.
         */
        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              `Failed to create user (${response.status}).`
          );
        }

        /*
         * SUCCESS
         *
         * PostgreSQL has confirmed
         * that the user was created.
         */

        /*
         * Delete saved draft.
         */
        try {
          localStorage.removeItem(
            STORAGE_KEY
          );
        } catch {
          // Ignore localStorage errors.
        }

        /*
         * Completely reset form.
         */
        setFormData({
          ...initialFormData,
        });

        setErrors({});
        setErrorMessage("");
        setDraftRestored(false);

        setSuccessMessage(
          "User created successfully."
        );

        /*
         * Return form to Account
         * before parent closes it.
         */
        setTimeout(() => {
          setStep(1);
          onSuccess();
        }, 700);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to create user."
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  /*
   * CANCEL
   *
   * Cancel now means:
   *
   * - close Add User
   * - discard the draft
   * - clear all fields
   */
  const handleCancel = () => {
    if (isSubmitting) {
      return;
    }

    try {
      localStorage.removeItem(
        STORAGE_KEY
      );
    } catch {
      // Ignore localStorage errors.
    }

    setFormData({
      ...initialFormData,
    });

    setErrors({});
    setErrorMessage("");
    setSuccessMessage("");
    setDraftRestored(false);
    setStep(1);

    onCancel();
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

  const errorInputClass =
    "w-full rounded-lg border border-red-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500";

  return (
    <form
      /*
       * NEVER allow native form
       * submission.
       *
       * Account creation only happens
       * through handleCreateUser().
       */
      onSubmit={(event) => {
        event.preventDefault();
      }}
      onKeyDown={
        handleKeyDown
      }
      noValidate
      className="rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      {/* HEADER */}

      <div className="border-b border-gray-200 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Add New User
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Create a new user
              account.
            </p>
          </div>

          {draftRestored && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Draft restored
            </span>
          )}
        </div>

        {/* PROGRESS */}

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className={`h-1.5 rounded-full ${
                  item <= step
                    ? "bg-gray-900"
                    : "bg-gray-200"
                }`}
              />
            )
          )}
        </div>

        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span
            className={
              step === 1
                ? "font-semibold text-gray-900"
                : ""
            }
          >
            Account
          </span>

          <span
            className={
              step === 2
                ? "font-semibold text-gray-900"
                : ""
            }
          >
            Details
          </span>

          <span
            className={
              step === 3
                ? "font-semibold text-gray-900"
                : ""
            }
          >
            Review
          </span>
        </div>
      </div>

      {/* CONTENT */}

      <div className="p-5">
        {errorMessage && (
          <div
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            role="status"
          >
            {successMessage}
          </div>
        )}

        {/* STEP 1 */}

        {step === 1 && (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="user-name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>

              <input
                id="user-name"
                type="text"
                value={
                  formData.name
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                placeholder="John Smith"
                autoComplete="name"
                className={
                  errors.name
                    ? errorInputClass
                    : inputClass
                }
              />

              {errors.name && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="user-email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email
              </label>

              <input
                id="user-email"
                type="email"
                value={
                  formData.email
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
                placeholder="john@example.com"
                autoComplete="email"
                className={
                  errors.email
                    ? errorInputClass
                    : inputClass
                }
              />

              {errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="user-role"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Role
              </label>

              <select
                id="user-role"
                value={
                  formData.role
                }
                onChange={(
                  event
                ) => {
                  const nextRole =
                    event.target.value;

                  updateField(
                    "role",
                    nextRole
                  );

                  if (
                    nextRole !==
                    "Administrator"
                  ) {
                    updateField(
                      "accessJustification",
                      ""
                    );
                  }
                }}
                className={
                  errors.role
                    ? errorInputClass
                    : inputClass
                }
              >
                <option value="User">
                  User
                </option>

                <option value="Manager">
                  Manager
                </option>

                <option value="Administrator">
                  Administrator
                </option>
              </select>

              {errors.role && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.role}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="user-status"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Status
              </label>

              <select
                id="user-status"
                value={
                  formData.status
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "status",
                    event.target
                      .value as
                      | "Active"
                      | "Inactive"
                  )
                }
                className={
                  errors.status
                    ? errorInputClass
                    : inputClass
                }
              >
                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>

              {errors.status && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.status}
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 */}

        {step === 2 && (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="user-department"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Department
              </label>

              <input
                id="user-department"
                type="text"
                value={
                  formData.department
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "department",
                    event.target.value
                  )
                }
                placeholder="IT"
                className={
                  errors.department
                    ? errorInputClass
                    : inputClass
                }
              />

              {errors.department && (
                <p className="mt-1 text-xs text-red-600">
                  {
                    errors.department
                  }
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="user-job-title"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Job Title
              </label>

              <input
                id="user-job-title"
                type="text"
                value={
                  formData.jobTitle
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "jobTitle",
                    event.target.value
                  )
                }
                placeholder="IT Administrator"
                className={
                  errors.jobTitle
                    ? errorInputClass
                    : inputClass
                }
              />

              {errors.jobTitle && (
                <p className="mt-1 text-xs text-red-600">
                  {
                    errors.jobTitle
                  }
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="user-phone"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Phone
              </label>

              <input
                id="user-phone"
                type="tel"
                value={
                  formData.phone
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "phone",
                    event.target.value
                  )
                }
                placeholder="+971 50 123 4567"
                autoComplete="tel"
                className={
                  inputClass
                }
              />
            </div>

            {formData.role ===
              "Administrator" && (
              <div className="md:col-span-2">
                <label
                  htmlFor="user-access-justification"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Administrator Access
                  Justification{" "}
                  <span className="text-red-600">
                    *
                  </span>
                </label>

                <textarea
                  id="user-access-justification"
                  rows={3}
                  value={
                    formData.accessJustification
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "accessJustification",
                      event.target.value
                    )
                  }
                  placeholder="Explain why this user requires Administrator access..."
                  className={
                    errors.accessJustification
                      ? errorInputClass
                      : inputClass
                  }
                />

                {errors.accessJustification && (
                  <p className="mt-1 text-xs text-red-600">
                    {
                      errors.accessJustification
                    }
                  </p>
                )}

                <p className="mt-1 text-xs text-gray-500">
                  Required because
                  Administrator accounts
                  have elevated system
                  permissions.
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <label
                htmlFor="user-notes"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Notes
              </label>

              <textarea
                id="user-notes"
                rows={4}
                value={
                  formData.notes
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "notes",
                    event.target.value
                  )
                }
                placeholder="Add any additional notes..."
                className={
                  inputClass
                }
              />
            </div>
          </div>
        )}

        {/* STEP 3 - REVIEW ONLY */}

        {step === 3 && (
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Review User
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Please review the
              information carefully.
              Nothing will be saved
              until you click Create
              User.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ReviewItem
                label="Name"
                value={
                  formData.name
                }
              />

              <ReviewItem
                label="Email"
                value={
                  formData.email
                }
              />

              <ReviewItem
                label="Role"
                value={
                  formData.role
                }
              />

              <ReviewItem
                label="Status"
                value={
                  formData.status
                }
              />

              <ReviewItem
                label="Department"
                value={
                  formData.department
                }
              />

              <ReviewItem
                label="Job Title"
                value={
                  formData.jobTitle
                }
              />

              <ReviewItem
                label="Phone"
                value={
                  formData.phone ||
                  "Not provided"
                }
              />

              {formData.role ===
                "Administrator" && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Administrator Access
                    Justification
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                    {
                      formData.accessJustification
                    }
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Notes
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                  {formData.notes ||
                    "No notes added."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ACTIONS */}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={
            handleCancel
          }
          disabled={
            isSubmitting
          }
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {step > 1 && (
            <button
              type="button"
              onClick={
                handleBack
              }
              disabled={
                isSubmitting
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={
                handleNext
              }
              disabled={
                isSubmitting
              }
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step === 1
                ? "Continue"
                : "Review"}
            </button>
          ) : (
            <button
              /*
               * IMPORTANT:
               * This is intentionally
               * NOT type="submit".
               */
              type="button"
              onClick={
                handleCreateUser
              }
              disabled={
                isSubmitting
              }
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Creating..."
                : "Create User"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-gray-900">
        {value}
      </p>
    </div>
  );
}