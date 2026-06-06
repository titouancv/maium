import {
  Document,
  Page,
  View,
  Text,
  Link,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ResumePdfData } from "../types";
import { formatDuration, formatPeriod } from "../experiencePeriod";
import { RESUME_FONT_FAMILY } from "../fonts";

// Sober corporate palette (Goldman Sachs / JP Morgan style): no skill bars,
// no icons, no timeline. Uses the app's Cabinet Grotesk brand font.
const PRIMARY = "#0f172a";
const SECONDARY = "#334155";
const ACCENT = "#0ea5e9";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 40,
    paddingHorizontal: 48,
    fontFamily: RESUME_FONT_FAMILY,
    fontWeight: 700,
    fontSize: 10,
    color: SECONDARY,
    lineHeight: 1.5,
  },
  name: {
    fontSize: 22,
    fontWeight: 700,
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
  // Section title: label + a short rounded accent bar underneath, mirroring the
  // app's <Title> component (the `h-1 w-22 rounded-full bg-current` bar).
  sectionTitleWrap: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: PRIMARY,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  sectionTitleBar: {
    height: 3,
    width: 36,
    borderRadius: 2,
    marginTop: 3,
    backgroundColor: PRIMARY,
  },
  expBlock: { marginBottom: 12 },
  expTitle: { fontSize: 11, marginBottom: 2 },
  expOrg: { fontWeight: 700, color: PRIMARY },
  expRole: { color: SECONDARY },
  expMeta: { fontSize: 9, color: SECONDARY },
  expDescription: { fontSize: 10, color: SECONDARY, marginTop: 3 },
  eduBlock: { marginBottom: 6 },
  eduOrg: { fontWeight: 700, color: PRIMARY },
  skills: { lineHeight: 1.6 },
  maiumLink: { color: ACCENT, textDecoration: "none" },
  maiumRow: { flexDirection: "row", alignItems: "center" },
  maiumQr: { width: 56, height: 56, marginRight: 12 },
});

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={styles.sectionTitleBar} />
    </View>
  );
}

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
            <SectionTitle label="Profile" />
            <Text>{data.summary}</Text>
          </>
        ) : null}

        {data.experiences.length > 0 ? (
          <>
            <View style={styles.rule} />
            <SectionTitle label="Experience" />
            {data.experiences.map((exp, i) => (
              <View key={i} style={styles.expBlock} wrap={false}>
                <Text style={styles.expTitle}>
                  <Text style={styles.expOrg}>{exp.organization}</Text>
                  <Text style={styles.expRole}>{", " + exp.role}</Text>
                </Text>
                {exp.location ? (
                  <Text style={styles.expMeta}>{exp.location}</Text>
                ) : null}
                <Text style={styles.expMeta}>
                  {formatDuration(exp.startPeriod, exp.endPeriod)}
                  {"  •  "}
                  {formatPeriod(exp.startPeriod, exp.endPeriod)}
                </Text>
                {exp.description ? (
                  <Text style={styles.expDescription}>{exp.description}</Text>
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        {data.education.length > 0 ? (
          <>
            <View style={styles.rule} />
            <SectionTitle label="Education" />
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
            <SectionTitle label="Skills" />
            <Text style={styles.skills}>{data.skills.join("  •  ")}</Text>
          </>
        ) : null}

        {data.profileUrl ? (
          <>
            <View style={styles.rule} />
            <SectionTitle label="maium" />
            <View style={styles.maiumRow}>
              {data.profileQrCode ? (
                // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop
                <Image src={data.profileQrCode} style={styles.maiumQr} />
              ) : null}
              <Text>
                Find this profile on maium:{" "}
                <Link src={data.profileUrl} style={styles.maiumLink}>
                  {data.profileUrl}
                </Link>
              </Text>
            </View>
          </>
        ) : null}
      </Page>
    </Document>
  );
}
