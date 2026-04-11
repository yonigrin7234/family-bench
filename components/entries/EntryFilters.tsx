import { View, TextInput, Pressable, ScrollView } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useState } from 'react';
import { useEntriesStore } from '@/stores/entries';
import { entryTypeLabels } from '@/constants/theme';
import { entryTypes } from '@/schemas/entry';
import { Text } from 'react-native';

export function EntryFilters() {
  const filters = useEntriesStore((s) => s.filters);
  const setFilters = useEntriesStore((s) => s.setFilters);
  const clearFilters = useEntriesStore((s) => s.clearFilters);
  const [searchFocused, setSearchFocused] = useState(false);

  const activeType = filters.entryType;

  return (
    <View style={{ gap: 12 }}>
      {/* Search bar — full width, white, rounded-xl */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: searchFocused ? '#2563EB' : 'rgba(0,0,0,0.08)',
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
        }}
      >
        <Search size={16} strokeWidth={1.75} color="#9A9893" />
        <TextInput
          style={{
            flex: 1,
            fontFamily: 'System',
            fontSize: 15,
            color: '#1A1A18',
            marginLeft: 10,
          }}
          placeholder="Search entries..."
          placeholderTextColor="#9A9893"
          value={filters.searchQuery ?? ''}
          onChangeText={(q) => setFilters({ searchQuery: q || undefined })}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {filters.searchQuery ? (
          <Pressable onPress={() => setFilters({ searchQuery: undefined })} hitSlop={8}>
            <X size={16} strokeWidth={1.75} color="#9A9893" />
          </Pressable>
        ) : null}
      </View>

      {/* Date range chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { key: 'all_time', label: 'All time' },
            { key: '7d', label: 'Last 7 days' },
            { key: '30d', label: 'Last 30 days' },
            { key: '90d', label: 'Last 90 days' },
          ].map((range) => {
            const isActive = filters.dateRange
              ? range.key !== 'all_time'
              : range.key === 'all_time';
            // Simple active check by matching the range
            const currentRange = !filters.dateRange ? 'all_time' :
              filters.dateRange.start === new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] ? '7d' :
              filters.dateRange.start === new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0] ? '30d' : '90d';

            return (
              <Pressable
                key={range.key}
                onPress={() => {
                  if (range.key === 'all_time') {
                    setFilters({ dateRange: undefined });
                  } else {
                    const days = range.key === '7d' ? 7 : range.key === '30d' ? 30 : 90;
                    const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
                    const end = new Date().toISOString().split('T')[0];
                    setFilters({ dateRange: { start, end } });
                  }
                }}
                style={{
                  backgroundColor: currentRange === range.key ? '#1A1A18' : '#F0F0EA',
                  borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
                }}
              >
                <Text style={{
                  fontFamily: 'System', fontSize: 13, fontWeight: '500',
                  color: currentRange === range.key ? '#FFFFFF' : '#6B6A68',
                }}>
                  {range.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Type filter chips — no border, bg fill only */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* All chip */}
          <Pressable
            onPress={() => {
              clearFilters();
            }}
            style={{
              backgroundColor: !activeType && !filters.flaggedOnly ? '#1A1A18' : '#F0F0EA',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                fontFamily: 'System',
                fontSize: 13,
                color: !activeType && !filters.flaggedOnly ? '#FFFFFF' : '#6B6A68',
                fontWeight: '500',
              }}
            >
              All
            </Text>
          </Pressable>

          {/* Flagged chip */}
          <Pressable
            onPress={() => setFilters({ flaggedOnly: !filters.flaggedOnly, entryType: undefined })}
            style={{
              backgroundColor: filters.flaggedOnly ? '#1A1A18' : '#F0F0EA',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                fontFamily: 'System',
                fontSize: 13,
                color: filters.flaggedOnly ? '#FFFFFF' : '#6B6A68',
                fontWeight: '500',
              }}
            >
              Flagged
            </Text>
          </Pressable>

          {/* Entry type chips */}
          {entryTypes.map((type) => (
            <Pressable
              key={type}
              onPress={() =>
                setFilters({
                  entryType: activeType === type ? undefined : type,
                  flaggedOnly: false,
                })
              }
              style={{
                backgroundColor: activeType === type ? '#1A1A18' : '#F0F0EA',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: 'System',
                  fontSize: 13,
                  color: activeType === type ? '#FFFFFF' : '#6B6A68',
                  fontWeight: '500',
                }}
              >
                {entryTypeLabels[type]}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
