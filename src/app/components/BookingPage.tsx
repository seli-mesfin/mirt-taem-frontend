import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Calendar, Users, MapPin, Phone, Mail, ChevronRight, Check } from "lucide-react";
import { fetchProviderById, Provider } from "../../data/providers";
import { createTransaction } from "../../services/api";

export function BookingPage() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const currentSession = JSON.parse(localStorage.getItem('caterlink_users') || '[]')[0];
  const existingCustomer = currentSession?.userType === 'customer' ? currentSession : null;
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<Provider | undefined>(undefined);
  const [formData, setFormData] = useState({
    eventType: "",
    guestCount: "",
    date: "",
    time: "",
    location: "",
    name: existingCustomer?.name || "",
    phone: existingCustomer?.phone || "",
    email: existingCustomer?.email || "",
    notes: "",
  });

  const providerIdNumber = providerId ? parseInt(providerId, 10) : NaN;

  useEffect(() => {
    if (!isNaN(providerIdNumber)) {
      fetchProviderById(providerIdNumber)
        .then((result) => setProvider(result))
        .catch((error) => console.error('Failed to load provider:', error));
    }
  }, [providerIdNumber]);

  if (!provider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card rounded-3xl shadow-xl p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Provider not found</h1>
          <p className="text-muted-foreground mb-6">
            We could not find the provider for this booking request.
          </p>
          <button
            onClick={() => navigate("/providers")}
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Back to Providers
          </button>
        </div>
      </div>
    );
  }

  const eventTypes = [
    { value: "wedding", label: "Wedding" },
    { value: "birthday", label: "Birthday Party" },
    { value: "church", label: "Church Event" },
    { value: "corporate", label: "Corporate Event" },
    { value: "holiday", label: "Holiday Celebration" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    const totalAmount = parseInt(formData.guestCount) * provider.pricePerPerson;
    const commission = totalAmount * 0.1; // 10% commission
    const netAmount = totalAmount - commission;

    try {
      await createTransaction({
        providerId: providerIdNumber,
        providerName: provider.name,
        customerEmail: formData.email,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerLocation: formData.location,
        eventType: formData.eventType,
        eventDate: formData.date,
        eventTime: formData.time,
        guestCount: parseInt(formData.guestCount),
        amount: totalAmount,
        commission: commission,
        netAmount: netAmount,
        status: 'pending',
      });

      alert("Booking request submitted successfully! The provider will use your contact details to confirm the order.");
      navigate("/providers");
    } catch (err) {
      console.error('Failed to record transaction:', err);
      alert('Sorry, we could not submit your booking at this time. Please try again later.');
    }
  };

  const totalPrice = formData.guestCount
    ? parseInt(formData.guestCount) * provider.pricePerPerson
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c8502e]/10 via-background to-[#2d7a4e]/10 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Book Catering Service</h1>
          <p className="text-muted-foreground">with {provider.name}</p>
        </div>

        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  s < step
                    ? "bg-[#2d7a4e] text-white"
                    : s === step
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    s < step ? "bg-[#2d7a4e]" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl shadow-xl p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Event Details</h2>

                <div>
                  <label className="block text-sm font-medium mb-2">Event Type</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) =>
                      setFormData({ ...formData, eventType: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select event type</option>
                    {eventTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Number of Guests
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="number"
                      value={formData.guestCount}
                      onChange={(e) =>
                        setFormData({ ...formData, guestCount: e.target.value })
                      }
                      placeholder="e.g., 50"
                      min="1"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Event Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Event Time</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Event Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="Enter event address"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Contact Information</p>
                  {existingCustomer ? (
                    <div className="rounded-2xl border border-border bg-muted/50 p-4">
                      <p className="font-medium">{formData.name}</p>
                      <p className="text-sm text-muted-foreground">{formData.email}</p>
                      <p className="text-sm text-muted-foreground">{formData.phone}</p>
                      <p className="text-sm text-muted-foreground">{formData.location}</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Full Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your full name"
                          className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="0989840600"
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any dietary restrictions or special requests?"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Review & Confirm</h2>

                <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                  <h3 className="font-bold text-lg mb-4">Event Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Event Type</p>
                      <p className="font-medium capitalize">{formData.eventType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Number of Guests</p>
                      <p className="font-medium">{formData.guestCount} people</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{formData.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{formData.time}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{formData.location}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                  <h3 className="font-bold text-lg mb-4">Contact Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{formData.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{formData.email}</p>
                    </div>
                    {formData.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Special Requests</p>
                        <p className="font-medium">{formData.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border-2 border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">Estimated Total</span>
                    <span className="text-3xl font-bold text-primary">
                      {totalPrice.toLocaleString()} Birr
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formData.guestCount} guests × {provider.pricePerPerson} Birr/person
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {step < 3 ? (
                  <>
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Confirm Booking
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
