import { useEffect, useRef, useState } from "react";
import { Outlet, useParams, useSearchParams } from "react-router";
import { ErrorState, LoadingState } from "~/components/portal/PortalUi";
import { AuthProvider, useAuth } from "~/lib/auth";
import { isAdminRole } from "~/lib/portal";
import { ProspectDemoProvider } from "~/lib/ProspectDemoContext";
import { normalizeOfferTiers } from "~/lib/prospectDemo";
import type { ProspectDemo, PublicProspectDemo } from "~/lib/prospectDemo.types";
import { getSupabase } from "~/lib/supabase";

type LoadState =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "ready"; demo: PublicProspectDemo; isPreview: boolean };

function toPublicFromAdminRow(
  row: ProspectDemo,
  statusCode: string,
): PublicProspectDemo {
  return {
    public_slug: row.public_slug,
    trade_slug: row.trade_slug,
    enabled_offer_tiers: normalizeOfferTiers(row.enabled_offer_tiers),
    company_name: row.company_name,
    commercial_name: row.commercial_name,
    contact_first_name: row.contact_first_name,
    contact_last_name: row.contact_last_name,
    specialty: row.specialty,
    city: row.city,
    phone: row.phone,
    email: row.email,
    custom_tagline: row.custom_tagline,
    custom_intro: row.custom_intro,
    theme_id: row.theme_id,
    font_id: row.font_id,
    status_code: statusCode,
  };
}

/** AuthProvider requis pour le preview admin (hors layout espace-client). */
export default function ProspectDemoLayout() {
  return (
    <AuthProvider>
      <ProspectDemoLayoutInner />
    </AuthProvider>
  );
}

function ProspectDemoLayoutInner() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const wantPreview = searchParams.get("preview") === "1";
  const { session, profile, loading: authLoading } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const trackedSlug = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!slug) {
        setState({ status: "denied" });
        return;
      }
      const sb = getSupabase();
      if (!sb) {
        setState({ status: "denied" });
        return;
      }

      // Preview = intention seule. Droit = session admin + RLS SELECT.
      if (wantPreview) {
        if (authLoading) return;
        if (!session || !isAdminRole(profile?.role)) {
          if (!cancelled) setState({ status: "denied" });
          return;
        }
        const { data, error } = await sb
          .from("prospect_demos")
          .select("*, prospect_demo_statuses(code)")
          .eq("public_slug", slug)
          .maybeSingle();
        if (cancelled) return;
        if (error || !data) {
          setState({ status: "denied" });
          return;
        }
        const row = data as ProspectDemo & {
          prospect_demo_statuses?: { code: string } | null;
        };
        const statusCode = row.prospect_demo_statuses?.code ?? "";
        setState({
          status: "ready",
          demo: toPublicFromAdminRow(row, statusCode),
          isPreview: true,
        });
        return;
      }

      // Accès public uniquement via RPC (contrôles SQL).
      const { data, error } = await sb.rpc("get_public_prospect_demo", {
        p_slug: slug,
      });
      if (cancelled) return;
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        setState({ status: "denied" });
        return;
      }
      const row = (Array.isArray(data) ? data[0] : data) as PublicProspectDemo;
      setState({
        status: "ready",
        demo: {
          ...row,
          enabled_offer_tiers: normalizeOfferTiers(row.enabled_offer_tiers),
        },
        isPreview: false,
      });

      // Tracking atomique — jamais en preview admin.
      if (trackedSlug.current !== slug) {
        trackedSlug.current = slug;
        void sb.rpc("record_public_prospect_demo_view", { p_slug: slug });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, wantPreview, authLoading, session, profile?.role]);

  if (state.status === "loading" || (wantPreview && authLoading)) {
    return (
      <section className="section">
        <div className="container">
          <LoadingState label="Chargement de la démo…" />
        </div>
      </section>
    );
  }

  if (state.status === "denied") {
    return (
      <section className="section">
        <div className="container">
          <ErrorState message="Cette démo n’est pas disponible." />
        </div>
      </section>
    );
  }

  return (
    <ProspectDemoProvider demo={state.demo} isPreview={state.isPreview}>
      <Outlet />
    </ProspectDemoProvider>
  );
}
