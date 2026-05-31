// קומפוננטת חתימה: HTML canvas vanilla + מעבר ל-DataURL במעבר עכבר/אצבע.
// מחזירה data:image/png;base64,... ל-onChange כשהמשתמש מסיים stroke.
import { useEffect, useRef } from "react";

const SignaturePad = ({ value, onChange, height = 160 }) => {
    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef(null);

    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ratio = window.devicePixelRatio || 1;
        const rect = c.getBoundingClientRect();
        c.width = rect.width * ratio;
        c.height = rect.height * ratio;
        const ctx = c.getContext("2d");
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#111";
    }, []);

    const pointFromEvent = (e) => {
        const c = canvasRef.current;
        const rect = c.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : null;
        const clientX = touch ? touch.clientX : e.clientX;
        const clientY = touch ? touch.clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const start = (e) => {
        e.preventDefault();
        isDrawingRef.current = true;
        lastPointRef.current = pointFromEvent(e);
    };

    const move = (e) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        const p = pointFromEvent(e);
        const last = lastPointRef.current;
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        lastPointRef.current = p;
    };

    const end = () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        const dataUrl = canvasRef.current.toDataURL("image/png");
        onChange?.(dataUrl);
    };

    const clear = () => {
        const c = canvasRef.current;
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);
        onChange?.("");
    };

    return (
        <div className="border-2 border-dashed border-gray-400 rounded-lg bg-white">
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: `${height}px`,
                    touchAction: "none",
                    display: "block",
                }}
                onMouseDown={start}
                onMouseMove={move}
                onMouseUp={end}
                onMouseLeave={end}
                onTouchStart={start}
                onTouchMove={move}
                onTouchEnd={end}
            />
            <div className="flex items-center justify-between p-2 text-xs text-gray-600 border-t">
                <span>{value ? "✓ נחתם" : "חתום במסגרת זו"}</span>
                <button
                    type="button"
                    onClick={clear}
                    className="text-blue-600 hover:text-blue-800 underline"
                >
                    ניקוי
                </button>
            </div>
        </div>
    );
};

export default SignaturePad;
