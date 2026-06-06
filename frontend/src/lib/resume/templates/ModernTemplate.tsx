import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ResumePdfData } from "../types";

// Two-column layout for Product / Tech / Startup / Freelance profiles:
// a tinted sidebar (skills, education) next to the experience column.
// Colors mirror the app's light-mode semantic tokens (see globals.css).
const PRIMARY = "#ff4500"; // --primary-600
const ON_PRIMARY = "#fff2ee"; // --primary-50 (text on primary)
const SURFACE_50 = "#f4f3ee"; // --color-surface-50 (page bg)
const SURFACE_100 = "#e8e6df"; // --color-surface-100 (sidebar)
const BRD_200 = "#d5d1c8"; // --color-brd-200 (borders)
const INK = "#0f172a"; // --color-txt
const MUTED = "#818cf8"; // --color-txt-muted

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
    lineHeight: 1.5,
    backgroundColor: SURFACE_50,
  },
  header: {
    backgroundColor: PRIMARY,
    color: ON_PRIMARY,
    paddingVertical: 24,
    paddingHorizontal: 32,
  },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  headline: { fontSize: 11, marginTop: 3, color: ON_PRIMARY },
  contact: { fontSize: 9, marginTop: 6, color: ON_PRIMARY },
  body: { flexDirection: "row", flex: 1 },
  sidebar: {
    width: "33%",
    backgroundColor: SURFACE_50,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  main: { width: "67%", paddingVertical: 24, paddingHorizontal: 28 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  sidebarSpacer: { height: 18 },
  skillItem: { marginBottom: 3, color: MUTED },
  eduBlock: { marginBottom: 8 },
  eduOrg: { fontFamily: "Helvetica-Bold" },
  eduRole: { color: MUTED, fontSize: 9 },
  expBlock: { marginBottom: 12 },
  expOrg: { fontSize: 11, fontFamily: "Helvetica-Bold", color: INK },
  expRole: { fontSize: 10, color: PRIMARY, marginBottom: 4 },
  bulletRow: { flexDirection: "row", marginBottom: 2 },
  bulletDot: { width: 10, color: PRIMARY },
  bulletText: { flex: 1, color: MUTED },
});

export function ModernTemplate(data: ResumePdfData) {
  const contactLine = [
    data.contact.location,
    data.contact.email,
    data.contact.phone,
  ]
    .filter(Boolean)
    .join("   •   ");

  return (
    <Document title={`CV ${data.fullName}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{data.fullName}</Text>
          {data.headline ? (
            <Text style={styles.headline}>{data.headline}</Text>
          ) : null}
          {contactLine ? (
            <Text style={styles.contact}>{contactLine}</Text>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.sidebar}>
            {data.skills.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Compétences</Text>
                {data.skills.map((s, i) => (
                  <Text key={i} style={styles.skillItem}>
                    {s}
                  </Text>
                ))}
              </>
            ) : null}

            {data.education.length > 0 ? (
              <>
                {data.skills.length > 0 ? (
                  <View style={styles.sidebarSpacer} />
                ) : null}
                <Text style={styles.sectionTitle}>Formation</Text>
                {data.education.map((edu, i) => (
                  <View key={i} style={styles.eduBlock}>
                    <Text style={styles.eduOrg}>{edu.organization}</Text>
                    <Text style={styles.eduRole}>{edu.role}</Text>
                  </View>
                ))}
              </>
            ) : null}
          </View>

          <View style={styles.main}>
            {data.summary ? (
              <>
                <Text style={styles.sectionTitle}>Profil</Text>
                <Text style={{ marginBottom: 14, color: MUTED }}>
                  {data.summary}
                </Text>
              </>
            ) : null}

            {data.experiences.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Expérience</Text>
                {data.experiences.map((exp, i) => (
                  <View key={i} style={styles.expBlock} wrap={false}>
                    <Text style={styles.expOrg}>{exp.organization}</Text>
                    <Text style={styles.expRole}>{exp.role}</Text>
                    {exp.highlights.map((h, j) => (
                      <View key={j} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>{h}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}
