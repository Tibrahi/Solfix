import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import logo from '../assets/sol_fix.png';
import { config } from '../config';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    facebookName: '',
    presentWork: '',
    presentAddress: '',
    mobileNumber: '',
    desiredCourse: '',
    trainingFormat: '',
    paymentMode: '',
    paymentProof: '',
    additionalNotes: '',
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone) => {
    return /^\d{9}$/.test(phone.replace(/\D/g, ''));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setErrors((prev) => ({ ...prev, paymentProof: 'Only PNG, JPG allowed' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result;
        setPreviewImage(base64Data);
        // Store the base64 data in formData so it gets sent to the backend
        setFormData((prev) => ({ ...prev, paymentProof: base64Data }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Phone number is required';
    } else if (!validatePhone(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Enter 9 digits (e.g., 0788888888)';
    }

    if (!formData.desiredCourse) {
      newErrors.desiredCourse = 'Please select a course';
    }

    if (!formData.trainingFormat) {
      newErrors.trainingFormat = 'Please select training format';
    }

    if (!formData.paymentMode) {
      newErrors.paymentMode = 'Please select payment method';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit to backend
    setSubmitting(true);
    try {
      const response = await fetch(config.endpoints.applicants, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      // Show success modal
      setShowSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      setErrors({ submit: err.message || 'Failed to submit registration. Please check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
            <div className="flex items-center space-x-3 mb-4">
              <img src={logo} alt="Solfix" className="h-12 w-auto" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Course Registration
            </h1>
            <p className="text-gray-400">
              Fill out the form below to reserve your spot in our next training session.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-white font-medium mb-2">
                  Full Name <span className="text-white">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`w-full bg-black border ${
                    errors.fullName ? 'border-white' : 'border-gray-700'
                  } rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors`}
                />
                {errors.fullName && (
                  <p className="text-white text-sm mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Email Address <span className="text-white">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className={`w-full bg-black border ${
                    errors.email ? 'border-white' : 'border-gray-700'
                  } rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors`}
                />
                {errors.email && (
                  <p className="text-white text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Facebook Name */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Facebook Name
                </label>
                <input
                  type="text"
                  name="facebookName"
                  value={formData.facebookName}
                  onChange={handleChange}
                  placeholder="Your Facebook profile name"
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              {/* Present Work */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Present Work
                </label>
                <input
                  type="text"
                  name="presentWork"
                  value={formData.presentWork}
                  onChange={handleChange}
                  placeholder="Current occupation"
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              {/* Present Address */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Present Address
                </label>
                <input
                  type="text"
                  name="presentAddress"
                  value={formData.presentAddress}
                  onChange={handleChange}
                  placeholder="Your current address"
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Mobile Contact Number <span className="text-white">*</span>
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="078xxxxxxx"
                  maxLength={9}
                  className={`w-full bg-black border ${
                    errors.mobileNumber ? 'border-white' : 'border-gray-700'
                  } rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors`}
                />
                {errors.mobileNumber && (
                  <p className="text-white text-sm mt-1">{errors.mobileNumber}</p>
                )}
              </div>

              {/* Desired Course */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Desired Course <span className="text-white">*</span>
                </label>
                <select
                  name="desiredCourse"
                  value={formData.desiredCourse}
                  onChange={handleChange}
                  className={`w-full bg-black border ${
                    errors.desiredCourse ? 'border-white' : 'border-gray-700'
                  } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors`}
                >
                  <option value="">Select a course</option>
                  <option value="boardlevel">Board Level Repair Masterclass - 250,000 RWF</option>
                </select>
                {errors.desiredCourse && (
                  <p className="text-white text-sm mt-1">{errors.desiredCourse}</p>
                )}
              </div>

              {/* Training Format */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Training Format <span className="text-white">*</span>
                </label>
                <select
                  name="trainingFormat"
                  value={formData.trainingFormat}
                  onChange={handleChange}
                  className={`w-full bg-black border ${
                    errors.trainingFormat ? 'border-white' : 'border-gray-700'
                  } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors`}
                >
                  <option value="">Select format</option>
                  <option value="fulltime">Full-time (In-person)</option>
                  <option value="parttime">Part-time (Evenings)</option>
                  <option value="weekend">Weekend Classes</option>
                </select>
                {errors.trainingFormat && (
                  <p className="text-white text-sm mt-1">{errors.trainingFormat}</p>
                )}
              </div>

              {/* Payment Mode */}
              <div className="md:col-span-2">
                <label className="block text-white font-medium mb-2">
                  Mode of Payment <span className="text-white">*</span>
                </label>
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleChange}
                  className={`w-full bg-black border ${
                    errors.paymentMode ? 'border-white' : 'border-gray-700'
                  } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors`}
                >
                  <option value="">Select payment method</option>
                  <option value="mtn">MTN Mobile Money</option>
                  <option value="airtel">Airtel Money</option>
                  <option value="bk">Bank of Kigali (BK)</option>
                  <option value="equity">Equity Bank</option>
                </select>
                {errors.paymentMode && (
                  <p className="text-white text-sm mt-1">{errors.paymentMode}</p>
                )}
              </div>

              {/* Payment Proof Upload */}
              <div className="md:col-span-2">
                <label className="block text-white font-medium mb-2">
                  Proof of Payment Upload
                </label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
                  {previewImage ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={previewImage}
                        alt="Payment proof preview"
                        className="max-h-32 rounded mb-3"
                      />
                      <span className="text-white text-sm flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Image uploaded successfully
                      </span>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <svg className="text-gray-500 text-2xl mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <p className="text-gray-400 text-sm">
                        Click to upload payment receipt (PNG, JPG only)
                      </p>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {errors.paymentProof && (
                  <p className="text-white text-sm mt-1">{errors.paymentProof}</p>
                )}
              </div>

              {/* Additional Notes */}
              <div className="md:col-span-2">
                <label className="block text-white font-medium mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Any questions or special requirements?"
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            {errors.submit && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            <div className="mt-8">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
                  submitting
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Registration'
                )}
              </button>
              <p className="text-gray-500 text-sm text-center mt-4">
                By submitting, you agree to our terms and conditions. We will contact you within 24 hours.
              </p>
            </div>
          </form>
        </div>
      </main>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="text-white text-3xl" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
            <p className="text-gray-400 mb-6">
              Thank you for registering with Solfix Tech Company. We have received your application and will contact you within 24 hours.
            </p>
            <button
              onClick={() => {
                setShowSuccess(false);
                setFormData({
                  fullName: '',
                  email: '',
                  facebookName: '',
                  presentWork: '',
                  presentAddress: '',
                  mobileNumber: '',
                  desiredCourse: '',
                  trainingFormat: '',
                  paymentMode: '',
                  paymentProof: '',
                  additionalNotes: '',
                });
                setPreviewImage(null);
              }}
              className="bg-white text-black px-8 py-3 rounded-lg hover:bg-gray-200 transition-all font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}