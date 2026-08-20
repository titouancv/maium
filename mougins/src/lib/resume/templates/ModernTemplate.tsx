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
    backgroundColor: INK,
    color: ON_PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 4,
    borderBottomColor: PRIMARY,
  },
  headerText: { flex: 1, paddingRight: 12 },
  name: { fontSize: 22, fontWeight: 800 },
  nameBar: {
    height: 3,
    width: 42,
    borderRadius: 2,
    marginTop: 12,
    backgroundColor: ON_PRIMARY,
  },
  headerSubtitle: { fontSize: 9, color: ON_PRIMARY, marginTop: 8 },
  headerPseudo: { fontWeight: 800, color: ON_PRIMARY, textDecoration: "none" },
  headerQrCard: {
    backgroundColor: "#ffffff",
    borderRadius: 3,
    padding: 4,
  },
  headerQr: { width: 56, height: 56 },
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
  contactItem: { fontSize: 9, marginBottom: 3, color: INK },
  socialItem: { fontSize: 9, marginBottom: 3 },
  socialName: { color: INK },
  socialLink: { color: PRIMARY, textDecoration: "none" },
  skillItem: { marginBottom: 3, fontSize: 8, color: INK },
  expBlock: { marginBottom: 12 },
  expHeader: { flexDirection: "row" },
  expBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: MUTED,
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

export function ModernTemplate(data: ResumePdfData, labels: ResumeLabels) {
  const contactItems = [
    data.contact.location,
    data.contact.email,
    data.contact.phone,
  ].filter(Boolean);

  return (
    <Document title={`CV ${data.fullName}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.name}>{data.fullName}</Text>
            <View style={styles.nameBar} />
            {data.profileUrl ? (
              <Text style={styles.headerSubtitle}>
                {labels.findProfileShort + "  •  "}
                <Link src={data.profileUrl} style={styles.headerPseudo}>
                  @{data.pseudo}
                </Link>
              </Text>
            ) : null}
          </View>
          {data.profileUrl && data.profileQrCode ? (
            <View style={styles.headerQrCard}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
              <Image src={data.profileQrCode} style={styles.headerQr} />
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.sidebar}>
            {contactItems.length > 0 ? (
              <>
                <SectionTitle label={labels.contact} />
                {contactItems.map((c, i) => (
                  <Text key={i} style={styles.contactItem}>
                    {c}
                  </Text>
                ))}
              </>
            ) : null}

            {data.skills.length > 0 ? (
              <>
                <SectionTitle label={labels.skills} />
                <Text style={styles.skillItem}>
                  {data.skills.join("  •  ")}
                </Text>
              </>
            ) : null}

            {data.socialNetworks.length > 0 ? (
              <>
                <SectionTitle label={labels.social} />
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
          </View>

          <View style={styles.main}>
            {data.summary ? (
              <>
                <SectionTitle label={labels.profile} />
                <Text style={{ fontSize: 9, marginBottom: 12 }}>
                  {data.summary}
                </Text>
              </>
            ) : null}

            {data.experiences.length > 0 ? (
              <>
                <SectionTitle label={labels.experience} />
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
                            {labels.formatDuration(
                              exp.startPeriod,
                              exp.endPeriod,
                            )}
                            {"  •  "}
                            <Text
                              style={
                                exp.endPeriod
                                  ? styles.expMeta
                                  : styles.expPeriodOngoing
                              }
                            >
                              {labels.formatPeriod(
                                exp.startPeriod,
                                exp.endPeriod,
                              )}
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
                <SectionTitle label={labels.education} />
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
                            {labels.formatDuration(
                              edu.startPeriod,
                              edu.endPeriod,
                            )}
                            {"  •  "}
                            <Text
                              style={
                                edu.endPeriod
                                  ? styles.expMeta
                                  : styles.expPeriodOngoing
                              }
                            >
                              {labels.formatPeriod(
                                edu.startPeriod,
                                edu.endPeriod,
                              )}
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
