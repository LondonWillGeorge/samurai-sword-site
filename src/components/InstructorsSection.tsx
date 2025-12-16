import shihanPose from '@/assets/shihan-iaido-pose.jpg';

export const InstructorsSection = () => {
  return (
    <section id="instructors" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary tracking-[0.3em] text-sm mb-4">INSTRUCTORS</p>
          <h2 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            Our Sensei
          </h2>
          <div className="section-divider" />
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="japanese-border p-3 bg-card">
                <img
                  src={shihanPose}
                  alt="Shihan Mike Selvey"
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-3xl text-foreground mb-2">
                  Shihan Mike Selvey
                </h3>
                <p className="text-primary tracking-wider text-sm">
                  8th Dan Kyoshi • Chief Instructor
                </p>
              </div>

              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Mike Selvey met Otani Tomio Sensei in 1979 when he visited the dojo in Carshalton, Surrey. Otani Sensei's display of Iaido, Kendo and Aikido took Mike's breath away and he knew instantly that he had to become his student.
                </p>
                <p>
                  In 1984, Mike and Otani Sensei opened the Yodokan in Brockley, South London - a full time dojo where both Sensei broadened their skills and taught a greater number of students.
                </p>
                <p>
                  Since Otani Sensei's passing in 1991, Shihan Selvey has continued his legacy, teaching the traditional arts and maintaining the highest standards of Budo practice.
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground">Training location:</span> Tsunami Yodokan, Carshalton, Surrey
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
