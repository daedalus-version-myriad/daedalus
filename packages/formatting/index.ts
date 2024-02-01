export function englishList(list: any[], separator = "and"): string {
    return list.length === 0
        ? ""
        : list.length === 1
          ? `${list[0]}`
          : list.length === 2
            ? `${list[0]} ${separator} ${list[1]}`
            : `${list.slice(0, -1).join(", ")}, ${separator} ${list[list.length - 1]}`;
}
