import About from "@/components/sections/About-Us";
import BeforeAboutUs from "@/components/sections/Before-About-Us";
import CTA from "@/components/sections/Cta";
import OurBrands from "@/components/sections/Our-Brands";
import OurMarkets from "@/components/sections/Our-Markets";
import OurPresence from "@/components/sections/Our-Presence";
import OurTeam from "@/components/sections/Our-Team";

export default function page() {
    return (
        <>
            <BeforeAboutUs />
            <About />
            <OurMarkets />
            <OurPresence />
            <OurBrands />
            <OurTeam />
            <CTA />
        </>

    )
}