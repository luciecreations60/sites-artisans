import { useEffect, useState } from "react";
import {
  clearProfile,
  emptyProfile,
  loadProfile,
  saveProfile,
  type Profile,
} from "~/lib/personalize";

type Props = {
  compact?: boolean;
};

export function Personalizer({ compact }: Props) {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProfile(loadProfile() ?? emptyProfile());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const update = (field: keyof Profile, value: string) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  return (
    <div className="personalizer">
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem" }}>
        <strong>Personnaliser les démos</strong> — Ces infos s’affichent dans les démos à la
        place des exemples.
      </p>
      <div className="personalizer__grid">
        <div>
          <label htmlFor="sa-first">Prénom</label>
          <input
            id="sa-first"
            value={profile.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            autoComplete="given-name"
          />
        </div>
        <div>
          <label htmlFor="sa-last">Nom</label>
          <input
            id="sa-last"
            value={profile.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            autoComplete="family-name"
          />
        </div>
        <div>
          <label htmlFor="sa-company">Entreprise</label>
          <input
            id="sa-company"
            value={profile.company}
            onChange={(e) => update("company", e.target.value)}
            autoComplete="organization"
          />
        </div>
        <div>
          <label htmlFor="sa-city">Ville</label>
          <input
            id="sa-city"
            value={profile.city}
            onChange={(e) => update("city", e.target.value)}
          />
        </div>
        {!compact && (
          <>
            <div>
              <label htmlFor="sa-phone">Téléphone</label>
              <input
                id="sa-phone"
                value={profile.phone}
                onChange={(e) => update("phone", e.target.value)}
                inputMode="tel"
              />
            </div>
            <div>
              <label htmlFor="sa-email">E-mail</label>
              <input
                id="sa-email"
                value={profile.email}
                onChange={(e) => update("email", e.target.value)}
                type="email"
                autoComplete="email"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="sa-spec">Spécialité affichée</label>
              <input
                id="sa-spec"
                value={profile.specialty}
                onChange={(e) => update("specialty", e.target.value)}
              />
            </div>
          </>
        )}
      </div>
      <div className="hero-actions" style={{ marginTop: "0.75rem" }}>
        <button type="button" className="btn btn-primary" onClick={() => saveProfile(profile)}>
          Enregistrer
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            clearProfile();
            setProfile(emptyProfile());
          }}
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
}
