import { Flex, Text } from "@webstudio-is/design-system";

export const NothingFound = () => (
  <Flex align="center" justify="center" direction="column" gap="6">
    <Text variant="brandSectionTitle" as="h1" align="center">
      لم يتم العثور على نتائج 🙁
    </Text>
  </Flex>
);
