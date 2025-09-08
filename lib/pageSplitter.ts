// lib/pageSplitter.ts - Utility to split FileMaker pages into smaller chunks

export interface OriginalPage {
  id: string;
  title: string;
  names: Array<{name: string, panelNumber?: string, blockNumber?: string, originalRecord?: string} | string>;
  pageNumber: number;
}

export interface SplitPage {
  id: string;
  originalId: string;
  title: string;
  names: Array<{name: string, panelNumber?: string, blockNumber?: string, originalRecord?: string} | string>;
  pageNumber: number;
  subPage: string; // 'A', 'B', 'C', etc.
  displayTitle: string; // e.g., "Page 1A (names 1-20)"
  totalNamesInOriginal: number;
}

export class PageSplitter {
  private readonly CHUNK_SIZE = 20;

  /**
   * Split a single FileMaker page (44 names) into smaller chunks (20 names each)
   */
  splitPage(originalPage: OriginalPage): SplitPage[] {
    const { names } = originalPage;
    const chunks: SplitPage[] = [];
    
    for (let i = 0; i < names.length; i += this.CHUNK_SIZE) {
      const chunk = names.slice(i, i + this.CHUNK_SIZE);
      const subPageIndex = Math.floor(i / this.CHUNK_SIZE);
      const subPageLetter = String.fromCharCode(65 + subPageIndex); // A, B, C...
      
      const splitPage: SplitPage = {
        id: `${originalPage.id}-${subPageLetter}`,
        originalId: originalPage.id,
        title: originalPage.title,
        names: chunk,
        pageNumber: originalPage.pageNumber,
        subPage: subPageLetter,
        displayTitle: `Page ${originalPage.pageNumber}${subPageLetter} (names ${i + 1}-${Math.min(i + this.CHUNK_SIZE, names.length)})`,
        totalNamesInOriginal: names.length
      };
      
      chunks.push(splitPage);
    }
    
    return chunks;
  }

  /**
   * Split multiple FileMaker pages into new 20-name pages (regardless of original page boundaries)
   */
  splitPages(originalPages: OriginalPage[]): SplitPage[] {
    // First, collect ALL names from ALL pages into a single flat array
    const allNames: Array<{name: string, panelNumber?: string, blockNumber?: string, originalRecord?: string} | string> = [];
    
    for (const page of originalPages) {
      allNames.push(...page.names);
    }
    
    // Now create new pages with exactly 20 names each
    const splitPages: SplitPage[] = [];
    let pageNumber = 1;
    
    for (let i = 0; i < allNames.length; i += this.CHUNK_SIZE) {
      const chunk = allNames.slice(i, i + this.CHUNK_SIZE);
      
      const splitPage: SplitPage = {
        id: `page-${pageNumber}`,
        originalId: `synthetic-page-${pageNumber}`, // No longer tied to original FileMaker pages
        title: `Page ${pageNumber}`,
        names: chunk,
        pageNumber: pageNumber,
        subPage: 'A', // Not really used anymore
        displayTitle: `Page ${pageNumber}`,
        totalNamesInOriginal: allNames.length // Total of ALL names
      };
      
      splitPages.push(splitPage);
      pageNumber++;
    }
    
    return splitPages;
  }

  /**
   * Get a specific split page by its ID
   */
  getSplitPageById(originalPages: OriginalPage[], splitPageId: string): SplitPage | null {
    const allSplitPages = this.splitPages(originalPages);
    return allSplitPages.find(page => page.id === splitPageId) || null;
  }

  /**
   * Get statistics about the split
   */
  getStats(originalPages: OriginalPage[]) {
    const totalNames = originalPages.reduce((sum, page) => sum + page.names.length, 0);
    const fullPages = Math.floor(totalNames / this.CHUNK_SIZE);
    const lastPageNames = totalNames % this.CHUNK_SIZE;
    const totalSplitPages = lastPageNames > 0 ? fullPages + 1 : fullPages;
    
    return {
      originalPages: originalPages.length,
      splitPages: totalSplitPages,
      totalNames,
      fullPages: fullPages,
      lastPageNames: lastPageNames || this.CHUNK_SIZE,
      averageNamesPerSplitPage: totalNames / totalSplitPages,
      chunkSize: this.CHUNK_SIZE
    };
  }
}

// Export a singleton instance
export const pageSplitter = new PageSplitter();