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

// Sober corporate palette (Goldman Sachs / JP Morgan style): no skill bars,
// no icons, no timeline. Strictly black & white, set in the built-in
// Times-Roman serif font (no external font file needed).
const FONT_FAMILY = "Times-Roman";
const BLACK = "#000000";
const PRIMARY = BLACK;
const SECONDARY = BLACK;
const ACCENT = BLACK;

const styles = StyleSheet.create({
  page: {
    paddingVertical: 30,
    paddingHorizontal: 30,
    fontFamily: FONT_FAMILY,
    fontWeight: 400,
    fontSize: 9,
    color: SECONDARY,
    lineHeight: 1.5,
  },
  name: {
    fontSize: 22,
    fontWeight: 700,
    color: PRIMARY,

    letterSpacing: 1.5,
  },
  headline: {
    fontSize: 11,
    color: ACCENT,
    marginTop: 15,
    marginBottom: 6,
  },
  contact: { fontSize: 9, color: SECONDARY },
  rule: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY,
    marginLeft: 8,
  },
  // Section title: label + a short rounded accent bar underneath, mirroring the
  // app's <Title> component (the `h-1 w-22 rounded-full bg-current` bar).
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: PRIMARY,

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
  expHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  expTitle: { fontSize: 10 },
  expOrg: { fontWeight: 700, color: PRIMARY },
  expRole: { color: SECONDARY },
  expMeta: { fontSize: 8, color: SECONDARY, lineHeight: 1.2 },
  expDescription: { fontSize: 9, color: SECONDARY, marginTop: 3 },
  maiumLink: { color: ACCENT, textDecoration: "none" },
  maiumRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  maiumQr: { width: 56, height: 56, marginLeft: 12 },
});

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={styles.rule} />
    </View>
  );
}

export function FinanceTemplate(data: ResumePdfData) {
  const contactLine = [
    data.contact.location,
    data.contact.email,
    data.contact.phone,
  ]
    .filter(Boolean)
    .join("  |  ");

  return (
    <Document title={`CV ${data.fullName}`}>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.name}>{data.fullName}</Text>
          {data.headline ? (
            <Text style={styles.headline}>{data.headline}</Text>
          ) : null}
          {contactLine ? (
            <Text style={styles.contact}>{contactLine}</Text>
          ) : null}
        </View>

        {data.summary ? (
          <>
            <SectionTitle label="Profile" />
            <Text>{data.summary}</Text>
          </>
        ) : null}

        {data.experiences.length > 0 ? (
          <>
            <SectionTitle label="Experience" />
            {data.experiences.map((exp, i) => (
              <View key={i} style={styles.expBlock} wrap={false}>
                <View style={styles.expHeaderRow}>
                  <Text style={styles.expTitle}>
                    <Text style={styles.expOrg}>{exp.organization}</Text>
                    <Text style={styles.expRole}>{", " + exp.role}</Text>
                  </Text>
                  <Text style={styles.expMeta}>
                    <>
                      {exp.location ? exp.location + "  •  " : ""}
                      {formatDuration(exp.startPeriod, exp.endPeriod)}
                      {"  •  "}
                      {formatPeriod(exp.startPeriod, exp.endPeriod)}
                    </>
                  </Text>
                </View>
                {exp.description ? (
                  <Text style={styles.expDescription}>{exp.description}</Text>
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        {data.education.length > 0 ? (
          <>
            <SectionTitle label="Education" />
            {data.education.map((edu, i) => (
              <View key={i} style={styles.expBlock} wrap={false}>
                <View style={styles.expHeaderRow}>
                  <Text style={styles.expTitle}>
                    <Text style={styles.expOrg}>{edu.organization}</Text>
                    <Text style={styles.expRole}>{", " + edu.role}</Text>
                  </Text>
                  <Text style={styles.expMeta}>
                    <>
                      {edu.location ? edu.location + "  •  " : ""}
                      {formatDuration(edu.startPeriod, edu.endPeriod)}
                      {"  •  "}
                      {formatPeriod(edu.startPeriod, edu.endPeriod)}
                    </>
                  </Text>
                </View>
                {edu.description ? (
                  <Text style={styles.expDescription}>{edu.description}</Text>
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        {data.skills.length > 0 ? (
          <>
            <SectionTitle label="Skills" />
            <Text>{data.skills.join("  •  ")}</Text>
          </>
        ) : null}

        {data.profileUrl ? (
          <>
            <SectionTitle label="maium" />
            <View style={styles.maiumRow}>
              <Text>
                Find the full profile on maium:{" "}
                <Link src={data.profileUrl} style={styles.maiumLink}>
                  {data.profileUrl}
                </Link>
              </Text>
              {data.profileQrCode ? (
                // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop
                <Image src={data.profileQrCode} style={styles.maiumQr} />
              ) : null}
            </View>
          </>
        ) : null}
      </Page>
    </Document>
  );
}
