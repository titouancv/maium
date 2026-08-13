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

const PRIMARY = "#ff4500"; // --primary-600
const ON_PRIMARY = "#fff2ee"; // --primary-50 (text on primary)
const SURFACE_50 = "#f4f3ee"; // --color-surface-50 (page bg)
const INK = "#0f172a"; // --color-txt
const MUTED = "#818cf8"; // --color-txt-muted

const styles = StyleSheet.create({
  page: {
    fontFamily: RESUME_FONT_FAMILY,
    fontWeight: 700,
    fontSize: 10,
    color: INK,
    lineHeight: 1.5,
    backgroundColor: SURFACE_50,
  },
  header: {
    backgroundColor: PRIMARY,
    color: ON_PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  name: { fontSize: 22, fontWeight: 800 },
  nameBar: {
    height: 3,
    width: 42,
    borderRadius: 2,
    marginTop: 12,
    backgroundColor: ON_PRIMARY,
  },
  body: {
    flexDirection: "row",
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  sidebar: {
    width: "30%",
  },
  main: { flexDirection: "column", flex: 1, paddingLeft: 10 },
  sectionTitleWrap: { marginBottom: 8, marginTop: 4 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: INK,
  },
  sectionTitleBar: {
    height: 3,
    width: 42,
    borderRadius: 2,
    marginTop: 3,
    backgroundColor: INK,
  },
  contactItem: { fontSize: 9, marginBottom: 3, color: MUTED },
  socialItem: { fontSize: 9, marginBottom: 3 },
  socialName: { color: INK },
  socialLink: { color: PRIMARY, textDecoration: "none" },
  skillItem: { marginBottom: 3, fontSize: 8, color: INK },
  maiumText: { fontSize: 9, color: INK, marginBottom: 1 },
  maiumLink: { fontSize: 9, color: PRIMARY, textDecoration: "none" },
  maiumQr: { width: 64, height: 64, marginTop: 6 },
  expBlock: { marginBottom: 12 },
  expHeader: { flexDirection: "row" },
  expBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: INK,
    marginVertical: 2,
    marginRight: 10,
  },
  expContent: { flex: 1 },
  expTitle: { fontSize: 12, marginBottom: 2 },
  expOrg: { color: INK },
  expRole: { color: "rgba(15, 23, 42, 0.8)" },
  expMeta: { fontSize: 8, color: MUTED, lineHeight: 1.2 },
  expPeriodOngoing: { fontSize: 8, color: PRIMARY, lineHeight: 1.2 },
  expDescription: { fontSize: 9, color: INK, marginTop: 3, marginLeft: 13 },
});

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={styles.sectionTitleBar} />
    </View>
  );
}

export function ModernTemplate(data: ResumePdfData) {
  const contactItems = [
    data.contact.location,
    data.contact.email,
    data.contact.phone,
  ].filter(Boolean);

  return (
    <Document title={`CV ${data.fullName}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.name}>{data.fullName}</Text>
            <View style={styles.nameBar} />
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.sidebar}>
            {contactItems.length > 0 ? (
              <>
                <SectionTitle label="Contact" />
                {contactItems.map((c, i) => (
                  <Text key={i} style={styles.contactItem}>
                    {c}
                  </Text>
                ))}
              </>
            ) : null}

            {data.skills.length > 0 ? (
              <>
                <SectionTitle label="Skills" />
                <Text style={styles.skillItem}>
                  {data.skills.join("  •  ")}
                </Text>
              </>
            ) : null}

            {data.socialNetworks.length > 0 ? (
              <>
                <SectionTitle label="Social" />
                {data.socialNetworks.map((s, i) => (
                  <Text key={i} style={styles.socialItem}>
                    <Text style={styles.socialName}>{s.name + ": "}</Text>
                    <Link src={s.url} style={styles.socialLink}>
                      {s.handle}
                    </Link>
                  </Text>
                ))}
              </>
            ) : null}

            {data.profileUrl ? (
              <>
                <SectionTitle label="maium" />
                <Text style={styles.maiumText}>
                  Find the full profile on maium
                </Text>
                <Link src={data.profileUrl} style={styles.maiumLink}>
                  @{data.pseudo}
                </Link>
                {data.profileQrCode ? (
                  // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop
                  <Image src={data.profileQrCode} style={styles.maiumQr} />
                ) : null}
              </>
            ) : null}
          </View>

          <View style={styles.main}>
            {data.summary ? (
              <>
                <SectionTitle label="Profile" />
                <Text style={{ fontSize: 9, marginBottom: 12 }}>
                  {data.summary}
                </Text>
              </>
            ) : null}

            {data.experiences.length > 0 ? (
              <>
                <SectionTitle label="Experience" />
                {data.experiences.map((exp, i) => (
                  <View key={i} style={styles.expBlock} wrap={false}>
                    <View style={styles.expHeader}>
                      <View style={styles.expBar} />
                      <View style={styles.expContent}>
                        <Text style={styles.expTitle}>
                          <Text style={styles.expOrg}>{exp.organization}</Text>
                          <Text style={styles.expRole}>{", " + exp.role}</Text>
                        </Text>
                        <Text style={styles.expMeta}>
                          <>
                            {exp.location ? exp.location + "  •  " : ""}
                            {formatDuration(exp.startPeriod, exp.endPeriod)}
                            {"  •  "}
                            <Text
                              style={
                                exp.endPeriod
                                  ? styles.expMeta
                                  : styles.expPeriodOngoing
                              }
                            >
                              {formatPeriod(exp.startPeriod, exp.endPeriod)}
                            </Text>
                          </>
                        </Text>
                      </View>
                    </View>
                    {exp.description ? (
                      <Text style={styles.expDescription}>
                        {exp.description}
                      </Text>
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
                    <View style={styles.expHeader}>
                      <View style={styles.expBar} />
                      <View style={styles.expContent}>
                        <Text style={styles.expTitle}>
                          <Text style={styles.expOrg}>{edu.organization}</Text>
                          <Text style={styles.expRole}>{", " + edu.role}</Text>
                        </Text>
                        <Text style={styles.expMeta}>
                          <>
                            {edu.location ? edu.location + "  •  " : ""}
                            {formatDuration(edu.startPeriod, edu.endPeriod)}
                            {"  •  "}
                            <Text
                              style={
                                edu.endPeriod
                                  ? styles.expMeta
                                  : styles.expPeriodOngoing
                              }
                            >
                              {formatPeriod(edu.startPeriod, edu.endPeriod)}
                            </Text>
                          </>
                        </Text>
                      </View>
                    </View>
                    {edu.description ? (
                      <Text style={styles.expDescription}>
                        {edu.description}
                      </Text>
                    ) : null}
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
