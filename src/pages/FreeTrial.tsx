import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional(),
  message: z.string().trim().max(2000, "Message must be less than 2000 characters").optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const FreeTrial = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);

    // Validate form data
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof ContactFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: result.data,
      });

      if (error) {
        throw new Error(error.message || 'Failed to send message');
      }

      setIsSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err: any) {
      console.error('Error sending message:', err);
      setSubmitError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
              <span className="text-primary">Free</span> Trial Lesson
            </h1>
            <div className="section-divider mx-auto mb-6" />
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Experience the art of Tenshin Ryu with a complimentary trial lesson. 
              Complete beginners and experienced martial artists are equally welcome.
            </p>
          </div>

          {/* Success Message */}
          {isSubmitted ? (
            <div className="japanese-border p-8 bg-card text-center">
              <div className="text-6xl mb-4">道</div>
              <h2 className="font-heading text-2xl text-foreground mb-4">
                Message Sent Successfully
              </h2>
              <p className="text-muted-foreground mb-6">
                Thank you for your interest in Tenshin Ryu. We have sent a confirmation to your email 
                and will get back to you shortly to arrange your free trial lesson.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-primary hover:text-primary/80 transition-colors underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="japanese-border p-8 bg-card space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Name <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-background border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                    errors.name ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="Your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email <span className="text-primary">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-background border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                    errors.email ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Phone <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-background border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                    errors.phone ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="Your phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Message <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full px-4 py-3 bg-background border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none ${
                    errors.message ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="Tell us about yourself, your martial arts experience, or any questions you have..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-destructive">{errors.message}</p>
                )}
              </div>

              {/* Submit Error */}
              {submitError && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-sm">
                  <p className="text-sm text-destructive">{submitError}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-primary-foreground font-medium tracking-wider uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Request Free Trial'}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                We respect your privacy and will never share your information.
              </p>
            </form>
          )}

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Prefer to contact us directly?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:info@tenshinryu.co.uk" 
                className="text-primary hover:text-primary/80 transition-colors"
              >
                info@tenshinryu.co.uk
              </a>
              <span className="hidden sm:inline text-muted-foreground">|</span>
              <a 
                href="tel:07715255150" 
                className="text-primary hover:text-primary/80 transition-colors"
              >
                0771 5255150
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FreeTrial;
