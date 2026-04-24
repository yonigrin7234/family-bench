// Dev-only primitives gallery. Renders every softkit primitive in every
// meaningful variant so we can eyeball typography, spacing, and hairlines
// on iOS / Android / web before wiring real screens.

import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  BigChoice,
  Chip,
  type ChipTone,
  Display,
  FBStatusBar,
  HelpTip,
  Icon,
  type IconName,
  InfoCallout,
  MoodPicker,
  type MoodKey,
  NextStepCard,
  PillButton,
  ProgressBar,
  Rule,
  Seal,
  Segment,
  SoftCard,
  StepRail,
} from '@/components/ui/fb';

const ICON_NAMES: IconName[] = [
  'mic', 'plus', 'home', 'folder', 'scales', 'chat', 'flag', 'gavel',
  'caret', 'caretDown', 'shield', 'check', 'x', 'upload', 'paperclip',
  'sparkle', 'chevR', 'filter', 'pin', 'link', 'wave', 'spark', 'receipt',
  'search', 'clock', 'dot', 'grip', 'doc', 'camera', 'eye',
];

const CHIP_TONES: ChipTone[] = ['ink', 'ox', 'sand', 'forest', 'amber', 'mute'];

function Kicker({ children }: { children: string }) {
  return (
    <Text
      className="font-sans"
      style={{
        fontSize: 10.5,
        fontWeight: '600',
        color: '#B44028',
        letterSpacing: 1.05,
        textTransform: 'uppercase',
        marginTop: 18,
        marginBottom: 4,
      }}
    >
      {children}
    </Text>
  );
}

function Gap({ h = 8 }: { h?: number }) {
  return <View style={{ height: h }} />;
}

export default function Gallery() {
  const [segment, setSegment] = useState<'scheduled' | 'actual' | 'delta'>('actual');
  const [big, setBig] = useState<'modification' | 'contempt' | 'mediation'>('contempt');
  const [mood, setMood] = useState<MoodKey>('anxious');

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6F3' }}>
      <FBStatusBar />
      <ScrollView
        contentContainerStyle={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 48,
        }}
      >
        <Display size={32}>Primitives gallery</Display>
        <Gap h={4} />
        <Text
          className="font-sans"
          style={{ fontSize: 13, color: '#2B323D', lineHeight: 20 }}
        >
          Every softkit primitive, every meaningful variant. Paper system,
          0.5px hairlines, oxblood kickers.
        </Text>

        {/* Typography */}
        <Kicker>Display</Kicker>
        <SoftCard>
          <Display size={28}>Sans display</Display>
          <Gap h={6} />
          <Display size={28} italic>
            Serif italic guest
          </Display>
        </SoftCard>

        <Rule style={{ marginTop: 14 }} />

        {/* Seal */}
        <Kicker>Seal</Kicker>
        <SoftCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Seal />
            <Seal size={32} label="FB" />
          </View>
        </SoftCard>

        <Rule style={{ marginTop: 14 }} />

        {/* Rule */}
        <Kicker>Rule</Kicker>
        <SoftCard>
          <Text className="font-sans" style={{ color: '#2B323D' }}>Above</Text>
          <Rule style={{ marginVertical: 12 }} />
          <Text className="font-sans" style={{ color: '#2B323D' }}>Below</Text>
          <Rule style={{ marginVertical: 12 }} dashed />
          <Text className="font-sans" style={{ color: '#2B323D' }}>Dashed</Text>
        </SoftCard>

        <Rule style={{ marginTop: 14 }} />

        {/* Chip */}
        <Kicker>Chip</Kicker>
        <SoftCard>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {CHIP_TONES.map((t) => (
              <Chip key={`out-${t}`} tone={t}>
                {t}
              </Chip>
            ))}
          </View>
          <Gap h={8} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {CHIP_TONES.map((t) => (
              <Chip key={`fill-${t}`} tone={t} outline={false}>
                {t} filled
              </Chip>
            ))}
          </View>
        </SoftCard>

        <Rule style={{ marginTop: 14 }} />

        {/* PillButton */}
        <Kicker>PillButton</Kicker>
        <SoftCard>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <PillButton tone="primary" size="sm">primary sm</PillButton>
            <PillButton tone="primary" size="md">primary md</PillButton>
            <PillButton tone="primary" size="lg">primary lg</PillButton>
          </View>
          <Gap h={8} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <PillButton tone="soft">soft</PillButton>
            <PillButton tone="ghost">ghost</PillButton>
            <PillButton tone="accent">accent</PillButton>
            <PillButton tone="accentSoft">accentSoft</PillButton>
          </View>
          <Gap h={8} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <PillButton tone="primary" icon="mic">Left icon</PillButton>
            <PillButton tone="ghost" iconRight="caret">Right icon</PillButton>
            <PillButton tone="accent" icon="plus" iconRight="chevR">Both</PillButton>
          </View>
          <Gap h={8} />
          <PillButton tone="primary" full>
            Full width
          </PillButton>
        </SoftCard>

        <Rule style={{ marginTop: 14 }} />

        {/* SoftCard */}
        <Kicker>SoftCard</Kicker>
        <SoftCard>
          <Text className="font-sans" style={{ color: '#2B323D' }}>
            Default card — body content only, no title header.
          </Text>
        </SoftCard>
        <Gap h={8} />
        <SoftCard title="With title" />
        <Gap h={8} />
        <SoftCard title="Title + subtitle" subtitle="Descriptive sub-line." />
        <Gap h={8} />
        <SoftCard
          title="Title + right slot"
          subtitle="Verified evidence"
          right={<Chip tone="forest">Verified</Chip>}
        />
        <Gap h={8} />
        <SoftCard title="Accent card" subtitle="Oxblood washed border" accent>
          <Text className="font-sans" style={{ color: '#2B323D' }}>
            Accent variant — for cards that want the eye first.
          </Text>
        </SoftCard>

        <Rule style={{ marginTop: 14 }} />

        {/* StepRail */}
        <Kicker>StepRail</Kicker>
        <SoftCard>
          <StepRail
            current={2}
            steps={[
              { label: 'Describe what happened', hint: 'Date + setting is enough.' },
              { label: 'Who was there' },
              {
                label: 'Capture evidence',
                hint: 'Photos, receipts, messages.',
                badge: 'Needed',
                sub: [
                  { label: 'Saturday text thread', done: true },
                  { label: 'Photo of exchange point', done: true },
                  { label: 'Witness contact' },
                ],
              },
              { label: 'Review and submit' },
            ]}
          />
        </SoftCard>

        <Rule style={{ marginTop: 14 }} />

        {/* ProgressBar */}
        <Kicker>ProgressBar</Kicker>
        <SoftCard>
          <ProgressBar pct={0} label="Not started" />
          <Gap h={10} />
          <ProgressBar pct={25} label="Filing prep" />
          <Gap h={10} />
          <ProgressBar pct={50} label="Halfway" />
          <Gap h={10} />
          <ProgressBar pct={72} label="Evidence gathered" />
          <Gap h={10} />
          <ProgressBar pct={100} label="Complete" />
          <Gap h={10} />
          <ProgressBar pct={45} />
        </SoftCard>

        <Rule style={{ marginTop: 14 }} />

        {/* HelpTip */}
        <Kicker>HelpTip</Kicker>
        <SoftCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text className="font-sans" style={{ color: '#2B323D' }}>A </Text>
            <HelpTip term="custody evaluation">explainer</HelpTip>
            <Text className="font-sans" style={{ color: '#2B323D' }}>
              {' '}happens before the hearing.
            </Text>
          </View>
          <Gap h={10} />
          <HelpTip term="contempt" inline />
        </SoftCard>

        <Rule style={{ marginTop: 14 }} />

        {/* InfoCallout */}
        <Kicker>InfoCallout</Kicker>
        <InfoCallout title="Why this matters" tone="ink">
          The neutral tone — used for context callouts inside cards.
        </InfoCallout>
        <Gap h={10} />
        <InfoCallout title="Attention" tone="ox">
          This is legal information, not advice. A California family lawyer
          would refine this further in an hour.
        </InfoCallout>
        <Gap h={10} />
        <InfoCallout title="Protected" tone="forest">
          Because you opted into preservation mode, every entry is signed with
          three independent timestamps.
        </InfoCallout>

        <Rule style={{ marginTop: 14 }} />

        {/* BigChoice */}
        <Kicker>BigChoice</Kicker>
        <SoftCard>
          <BigChoice
            label="Modification"
            hint="Change the custody order"
            icon="scales"
            selected={big === 'modification'}
            onPress={() => setBig('modification')}
          />
          <Gap h={8} />
          <BigChoice
            label="Contempt"
            hint="Enforcement with consequences"
            icon="gavel"
            badge="Most likely"
            selected={big === 'contempt'}
            onPress={() => setBig('contempt')}
          />
          <Gap h={8} />
          <BigChoice
            label="Mediation"
            hint="Outside the courtroom"
            icon="chat"
            selected={big === 'mediation'}
            onPress={() => setBig('mediation')}
          />
        </SoftCard>

        <Rule style={{ marginTop: 14 }} />

        {/* MoodPicker */}
        <Kicker>MoodPicker</Kicker>
        <SoftCard>
          <MoodPicker value={mood} onPick={setMood} />
        </SoftCard>

        <Rule style={{ marginTop: 14 }} />

        {/* Segment */}
        <Kicker>Segment</Kicker>
        <SoftCard>
          <Segment
            value={segment}
            onChange={setSegment}
            items={[
              { v: 'scheduled', label: 'Scheduled' },
              { v: 'actual',    label: 'Actual' },
              { v: 'delta',     label: 'Delta' },
            ]}
          />
        </SoftCard>

        <Rule style={{ marginTop: 14 }} />

        {/* NextStepCard */}
        <Kicker>NextStepCard</Kicker>
        <NextStepCard
          kicker="What's next"
          title="Prepare your RFO"
          body="A Request for Order starts the modification path. You have 14 days before your hearing."
          primary="Start"
          secondary="Why this"
          tone="ox"
        />
        <Gap h={12} />
        <NextStepCard
          kicker="Today"
          title="Log yesterday's exchange"
          body="Three minutes and the week is documented."
          primary="Capture"
          secondary="Skip"
          tone="ink"
        />

        <Rule style={{ marginTop: 14 }} />

        {/* Icon · ink 18 */}
        <Kicker>Icon · ink 18</Kicker>
        <SoftCard>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, columnGap: 10 }}>
            {ICON_NAMES.map((n) => (
              <View key={n} style={{ alignItems: 'center', width: 56 }}>
                <Icon name={n} size={18} color="#14181F" />
                <Text
                  className="font-mono"
                  style={{
                    fontSize: 9,
                    color: 'rgba(20,24,31,0.58)',
                    marginTop: 6,
                  }}
                >
                  {n}
                </Text>
              </View>
            ))}
          </View>
        </SoftCard>

        {/* Icon · ox 22 (one row) */}
        <Kicker>Icon · ox 22</Kicker>
        <SoftCard>
          <View style={{ flexDirection: 'row', gap: 18 }}>
            {(['mic', 'gavel', 'shield', 'check', 'flag', 'spark'] as IconName[]).map((n) => (
              <Icon key={n} name={n} size={22} color="#B44028" />
            ))}
          </View>
        </SoftCard>

        <Gap h={24} />
        <Text
          className="font-serif"
          style={{
            fontSize: 14,
            fontStyle: 'italic',
            color: 'rgba(20,24,31,0.58)',
            textAlign: 'center',
          }}
        >
          end of gallery · primitives-only baseline
        </Text>
      </ScrollView>
    </View>
  );
}
