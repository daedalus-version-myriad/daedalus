import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";

export default function PageSelector({ page, pages }: { page: number; pages: number }) {
    if (pages === 1)
        return (
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious></PaginationPrevious>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationLink href="?page=1" isActive>
                            1
                        </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationNext></PaginationNext>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        );

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious href={page === 1 ? undefined : `?page=${page - 1}`}></PaginationPrevious>
                </PaginationItem>
                <PaginationItem>
                    <PaginationLink href="?page=1" isActive={page === 1}>
                        1
                    </PaginationLink>
                </PaginationItem>
                {page > 2 ? (
                    <PaginationItem>
                        <PaginationEllipsis></PaginationEllipsis>
                    </PaginationItem>
                ) : null}
                {page > 1 && page < pages ? (
                    <PaginationItem>
                        <PaginationLink href={`?page=${page}`} isActive>
                            {page}
                        </PaginationLink>
                    </PaginationItem>
                ) : null}
                {page < pages - 1 ? (
                    <PaginationItem>
                        <PaginationEllipsis></PaginationEllipsis>
                    </PaginationItem>
                ) : null}
                {pages > 1 ? (
                    <PaginationItem>
                        <PaginationLink href={`?page=${pages}`} isActive={page === pages}>
                            {pages}
                        </PaginationLink>
                    </PaginationItem>
                ) : null}
            </PaginationContent>
        </Pagination>
    );
}
