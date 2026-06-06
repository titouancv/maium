import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ResumePdfData } from "../types";

// Sober corporate palette (Goldman Sachs / JP Morgan style): no skill bars,
// no icons, no timeline. Built-in Helvetica keeps the bundle browser-free.
const PRIMARY = "#0f172a";
const SECONDARY = "#334155";
const ACCENT = "#0ea5e9";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 40,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: SECONDARY,
    lineHeight: 1.5,
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  headline: {
    fontSize: 11,
    color: ACCENT,
    marginTop: 2,
    marginBottom: 6,
  },
  contact: { fontSize: 9, color: SECONDARY },
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY,
    marginTop: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  expBlock: { marginBottom: 12 },
  expOrg: { fontSize: 11, fontFamily: "Helvetica-Bold", color: PRIMARY },
  expRole: { fontSize: 10, color: SECONDARY, marginBottom: 4 },
  bulletRow: { flexDirection: "row", marginBottom: 2 },
  bulletDot: { width: 10, color: ACCENT },
  bulletText: { flex: 1 },
  eduBlock: { marginBottom: 6 },
  eduOrg: { fontFamily: "Helvetica-Bold", color: PRIMARY },
  skills: { lineHeight: 1.6 },
});

export function FinanceTemplate(data: ResumePdfData) {
  const contactLine = [data.contact.location, data.contact.email, data.contact.phone]
    .filter(Boolean)
    .join("  |  ");

  return (
    <Document title={`CV ${data.fullName}`}>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.name}>{data.fullName}</Text>
          {data.headline ? <Text style={styles.headline}>{data.headline}</Text> : null}
          {contactLine ? <Text style={styles.contact}>{contactLine}</Text> : null}
        </View>

        {data.summary ? (
          <>
            <View style={styles.rule} />
            <Text style={styles.sectionTitle}>Profil</Text>
            <Text>{data.summary}</Text>
          </>
        ) : null}

        {data.experiences.length > 0 ? (
          <>
            <View style={styles.rule} />
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

        {data.education.length > 0 ? (
          <>
            <View style={styles.rule} />
            <Text style={styles.sectionTitle}>Formation</Text>
            {data.education.map((edu, i) => (
              <View key={i} style={styles.eduBlock}>
                <Text style={styles.eduOrg}>{edu.organization}</Text>
                <Text>{edu.role}</Text>
              </View>
            ))}
          </>
        ) : null}

        {data.skills.length > 0 ? (
          <>
            <View style={styles.rule} />
            <Text style={styles.sectionTitle}>Compétences</Text>
            <Text style={styles.skills}>{data.skills.join("  •  ")}</Text>
          </>
        ) : null}
      </Page>
    </Document>
  );
}
