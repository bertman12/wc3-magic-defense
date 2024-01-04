import { TextTag, Unit } from "w3ts";
import { delayedTimer } from "./timer";
/**
 * https://www.hiveworkshop.com/threads/floating-text.149719/
 * 
 * function CreateFloatingText takes string text, real x, real y, real heightOffset, real duration, real size returns nothing
    local texttag tt = CreateTextTag()
    call SetTextTagText(tt, text, size)
    call SetTextTagPos(tt, x, y, heightOffset)
    call SetTextTagColor(tt, 255, 255, 255, 255) // RGBA format
    call SetTextTagVisibility(tt, true)
    call SetTextTagLifespan(tt, duration)
    call SetTextTagPermanent(tt, false)
endfunction

function ExampleUsage takes nothing returns nothing
    call CreateFloatingText("Hello World", 0.0, 0.0, 25.0, 5.0, 10.0)
endfunction
 * @param unit 
 * @param text 
 * @param duration 
 */
export function createTextTagOnUnit(unit: Unit, text: string, config?: { duration?: number; yVelocity?: number; xVelocity?: number; useFade?: boolean }) {
    const tag = TextTag.create();
    tag?.setVisible(true);

    tag?.setText(text, 10, true);
    tag?.setLifespan(2);

    if (config?.useFade !== false) {
        tag?.setFadepoint(0.01);
    }

    tag?.setVelocity(config?.xVelocity ?? 0, config?.yVelocity ?? 0.025);
    tag?.setPermanent(false);

    tag?.setPosUnit(unit, 10);

    delayedTimer(config?.duration ?? 2, () => {
        tag?.destroy();
    });
}
