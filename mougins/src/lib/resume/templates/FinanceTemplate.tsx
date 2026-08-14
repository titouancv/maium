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
import type { ResumeLabels } from "../labels";

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
  contact: { fontSize: 9, color: SECONDARY, marginTop: 15 },
  rule: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY,
    marginLeft: 8,
  },
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

export function FinanceTemplate(data: ResumePdfData, labels: ResumeLabels) {
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
          {contactLine ? (
            <Text style={styles.contact}>{contactLine}</Text>
          ) : null}
        </View>

        {data.summary ? (
          <>
            <SectionTitle label={labels.profile} />
            <Text>{data.summary}</Text>
          </>
        ) : null}

        {data.experiences.length > 0 ? (
          <>
            <SectionTitle label={labels.experience} />
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
                      {labels.formatDuration(exp.startPeriod, exp.endPeriod)}
                      {"  •  "}
                      {labels.formatPeriod(exp.startPeriod, exp.endPeriod)}
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
            <SectionTitle label={labels.education} />
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
                      {labels.formatDuration(edu.startPeriod, edu.endPeriod)}
                      {"  •  "}
                      {labels.formatPeriod(edu.startPeriod, edu.endPeriod)}
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
            <SectionTitle label={labels.skills} />
            <Text>{data.skills.join("  •  ")}</Text>
          </>
        ) : null}

        {data.profileUrl ? (
          <>
            <SectionTitle label={labels.network} />
            <View style={styles.maiumRow}>
              <Text>
                {labels.findProfile}{" "}
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
