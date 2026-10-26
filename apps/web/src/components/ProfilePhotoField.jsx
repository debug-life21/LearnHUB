export function ProfilePhotoField({ value, onChange }) {
    const handlePhoto = (event) => {
        const input = event.currentTarget;
        const file = event.target.files?.[0];
        if (!file) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            input.setCustomValidity("Choose a JPG, PNG, or WebP image.");
            input.reportValidity();
            input.setCustomValidity("");
            input.value = "";
            return;
        }
        if (file.size > 1024 * 1024) {
            input.setCustomValidity("Profile photos must be 1 MB or smaller.");
            input.reportValidity();
            input.setCustomValidity("");
            input.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") onChange(reader.result);
            input.value = "";
        };
        reader.onerror = () => {
            input.setCustomValidity("Could not read that image. Please choose another file.");
            input.reportValidity();
            input.setCustomValidity("");
            input.value = "";
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex flex-wrap items-center gap-4">
            {value ? (
                <img src={value} alt="Profile" className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-200" />
            ) : (
                <div aria-label="No profile photo" className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400 ring-2 ring-slate-200">
                    👤
                </div>
            )}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                    Profile photo
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} className="mt-1 block w-full max-w-xs text-xs font-normal"/>
                </label>
                <p className="text-[11px] text-slate-500">JPG, PNG, or WebP · maximum 1 MB</p>
                {value ? <button type="button" onClick={() => onChange("")} className="text-xs font-semibold text-rose-700 hover:underline">Remove photo</button> : null}
            </div>
        </div>
    );
}
