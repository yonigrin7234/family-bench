import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useState } from 'react';
import { useEntriesStore } from '@/stores/entries';
import { entryTypeLabels } from '@/constants/theme';
import { entryTypes } from '@/schemas/entry';

export function EntryFilters() {
  const filters = useEntriesStore((s) => s.filters);
  const setFilters = useEntriesStore((s) => s.setFilters);
  const clearFilters = useEntriesStore((s) => s.clearFilters);
  const [searchVisible, setSearchVisible] = useState(false);

  const hasFilters = filters.entryType || filters.flaggedOnly || filters.searchQuery;

  return (
    <View className="gap-2 mb-3">
      {/* Search bar */}
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => setSearchVisible(!searchVisible)}
          className="w-9 h-9 rounded-full bg-surface dark:bg-dark-surface items-center justify-center"
        >
          <Search size={18} strokeWidth={1.75} className="text-text-muted" />
        </Pressable>

        {searchVisible && (
          <View className="flex-1 flex-row items-center bg-surface dark:bg-dark-surface border border-border rounded-input px-3 h-9">
            <Search size={16} strokeWidth={1.75} className="text-text-muted mr-2" />
            <TextInput
              className="flex-1 font-ui text-[14px] text-text-primary dark:text-dark-text"
              placeholder="Search entries..."
              placeholderTextColor="#9A9893"
              value={filters.searchQuery ?? ''}
              onChangeText={(q) => setFilters({ searchQuery: q || undefined })}
              autoFocus
            />
            {filters.searchQuery && (
              <Pressable onPress={() => setFilters({ searchQuery: undefined })}>
                <X size={16} strokeWidth={1.75} className="text-text-muted" />
              </Pressable>
            )}
          </View>
        )}

        {hasFilters && (
          <Pressable onPress={clearFilters} className="px-2 py-1">
            <Text className="font-ui text-[13px] text-accent">Clear</Text>
          </Pressable>
        )}
      </View>

      {/* Type filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
        <View className="flex-row gap-1.5 pr-4">
          <Pressable
            onPress={() => setFilters({ flaggedOnly: !filters.flaggedOnly })}
            className={`px-3 py-1.5 rounded-button border ${
              filters.flaggedOnly
                ? 'border-danger bg-danger-light'
                : 'border-border bg-surface dark:bg-dark-surface'
            }`}
          >
            <Text
              className={`font-ui text-[12px] ${
                filters.flaggedOnly ? 'text-danger font-medium' : 'text-text-muted'
              }`}
            >
              Flagged
            </Text>
          </Pressable>

          {entryTypes.map((type) => (
            <Pressable
              key={type}
              onPress={() =>
                setFilters({
                  entryType: filters.entryType === type ? undefined : type,
                })
              }
              className={`px-3 py-1.5 rounded-button border ${
                filters.entryType === type
                  ? 'border-accent bg-accent-lighter'
                  : 'border-border bg-surface dark:bg-dark-surface'
              }`}
            >
              <Text
                className={`font-ui text-[12px] ${
                  filters.entryType === type ? 'text-accent font-medium' : 'text-text-muted'
                }`}
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
