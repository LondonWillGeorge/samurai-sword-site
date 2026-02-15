import { YouTubeVideo, VideoPlaceholder } from '@/components/YouTubeVideo';

export const VideosSection = () => {
  return (
    <section id="videos" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary tracking-[0.3em] text-sm mb-4">VIDEOS</p>
          <h2 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            Tenshin Ryu In Motion
          </h2>
          <p className="text-muted-foreground tracking-wide text-sm mb-4">
            Too fast to follow? Use slider below video to slow down or speed up!
            <br />
            After playing once, you can click bottom left video to play again, no
            need to click 'Watch again on YouTube'.
          </p>
          <div className="section-divider" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <YouTubeVideo videoId="4LcpgyGT9_Y" caption="Jo (4-foot staff) Kata" />
          <YouTubeVideo
            videoId="h17azJvqBpA"
            caption="Tenshin Ryu Style - First 4 Standing Forms"
          />
          <YouTubeVideo videoId="FFOFYasid8M" caption="Tonfa Strikes Kata" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <YouTubeVideo videoId="Mj-6IDGRpL8" caption="Nagamaki Demonstration" />
          <YouTubeVideo
            videoId="6LfYWCkKG0U"
            caption="Sword Kata Moves followed by Tameshigiri Cutting"
          />
          <YouTubeVideo videoId="Sq0PmR5-2_k" caption="Sai Strikes Kata" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <YouTubeVideo
            videoId="woLf7JKs19E"
            caption="Sai Deflections/Blocks Kata"
          />
          <YouTubeVideo
            videoId="Jsgz2TaFGeA"
            caption="Jo (Staff) against Tonfa Demonstration - Robinson senseis"
          />
          <YouTubeVideo
            videoId="28vAKJ18gss"
            caption="Tonfa Deflections / Blocks Kata - Sensei Luke"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <YouTubeVideo
            videoId="-aZCYn5ZWig"
            caption="Jo (Staff) Strikes Kata - Sensei Luke"
          />
          <YouTubeVideo
            videoId="qtt4ICD0Szw"
            caption="Jutsu Tonfa Kata - Shihan Selvey"
          />
          <YouTubeVideo
            videoId="TQL8X6yp_2Y"
            caption="Double Cut Tameshigiri (higher dan grade cuts)"
          />
          {/* <VideoPlaceholder /> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <YouTubeVideo
            videoId="0_6HvDojnxA"
            caption="2023 - Team Visit Japan - Wakayama Buddhist Temple"
          />
          <YouTubeVideo
            videoId="RTZ33OvsmAo"
            caption="1980s? Otani Sensei Teaching Tenshin Ryu Style - 13th Seiza (seated) form - Seppuku"
          />
          <YouTubeVideo
            videoId="_9rTOZ8zbOA"
            caption="2020 - Shihan Selvey - Japanese Sword advert"
          />
          {/* <VideoPlaceholder /> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <YouTubeVideo
            videoId="cJy-R2rj0Mk"
            caption="1973 Hanshi Box and Shihan Selvey - Judo Demo"
          />
          <YouTubeVideo
            videoId="t3jLTid4QDU"
            caption="1973 Hanshi Box and Shihan Selvey - Judo Demo - Part 2"
          />
          <YouTubeVideo
            videoId="88sXOW3aw08"
            caption="Shihan Selvey - 4 Cuts Tameshigiri"
          />
        </div>

        {/* UNUSED TEMPLATE (do not nest JSX comments inside!)
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <YouTubeVideo videoId="" caption="" />
          <YouTubeVideo videoId="" caption="" />
          <YouTubeVideo videoId="" caption="" />
          VideoPlaceholder goes here
        </div>
        */}

        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm">
            More videos from our training sessions and events coming soon
          </p>
        </div>
      </div>
    </section>
  );
};