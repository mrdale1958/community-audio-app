// Full NameList type for detailed queries
type NameListData = {
  id: string;
  title: string;
  names: string; // JSON string of NameWithMetadata[]
  pageNumber: number;
  totalPages?: number | null;
  namesCount?: number;
  seriesId?: string | null;
  description?: string | null;
  createdAt: Date;
  createdBy: string;
  recordings: (Recording & {
    user: {
      name: string;
      email: string;
    };
  })[];
};// lib/pageManager.ts - Utilities for managing page-based name lists

import { prisma } from './prisma';
import { CONFIG, PageHelpers, ValidationHelpers } from './config';
import type { NameList, Recording, User } from '@prisma/client';

// Extended types to handle the new fields
type NameListWithRecordings = NameList & {
  recordings: (Recording & {
    user: {
      name: string;
      email: string;
    };
  })[];
};

// Name object structure with metadata
export interface NameWithMetadata {
  name: string;
  panelNumber?: string | number;
  blockNumber?: string | number;
  originalRecord?: string; // Reference to source record
}

// Temporary type to handle potential missing fields during migration
type NameListWithSummaryRecordings = {
  id: string;
  title: string;
  names: string; // JSON string of NameWithMetadata[]
  pageNumber: number;
  totalPages?: number | null;
  namesCount?: number;
  seriesId?: string | null;
  description?: string | null;
  createdAt: Date;
  createdBy: string;
  recordings: {
    status: string;
    createdAt: Date;
  }[];
};

export interface PageData {
  id: string;
  pageNumber: number;
  title: string;
  names: NameWithMetadata[]; // Changed from string[] to NameWithMetadata[]
  namesCount: number;
  totalPages?: number;
  seriesId?: string;
  hasRecording: boolean;
  recordings: Recording[];
  createdAt: Date;
}

export interface PageSummary {
  pageNumber: number;
  title: string;
  namesCount: number;
  recordingCount: number;
  hasApprovedRecording: boolean;
  lastRecordingDate?: Date;
}

export class PageManager {
  /**
   * Parse names from JSON string and convert to NameWithMetadata format
   */
  private static parseNamesWithMetadata(namesJson: string): NameWithMetadata[] {
    try {
      const rawNames = JSON.parse(namesJson);
      // Handle both old format (string[]) and new format (NameWithMetadata[])
      if (Array.isArray(rawNames) && rawNames.length > 0) {
        if (typeof rawNames[0] === 'string') {
          // Old format - convert to new format
          return rawNames.map(name => ({ name }));
        } else {
          // New format - validate structure
          return rawNames.map(item => ({
            name: item.name || String(item),
            panelNumber: item.panelNumber,
            blockNumber: item.blockNumber,
            originalRecord: item.originalRecord
          }));
        }
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error parsing names JSON:', error);
      return [];
    }
  }
  /**
   * Create a new page with names and metadata
   */
  static async createPage(
    names: NameWithMetadata[],
    pageNumber: number,
    userId: string,
    options: {
      title?: string;
      seriesId?: string;
      totalPages?: number;
      description?: string;
    } = {}
  ): Promise<NameList> {
    // Validate inputs
    if (!Array.isArray(names) || names.length === 0 || names.length > CONFIG.PAGE.NAMES_PER_PAGE) {
      throw new Error(`Page must contain 1-${CONFIG.PAGE.NAMES_PER_PAGE} names`);
    }

    if (!PageHelpers.isValidPageNumber(pageNumber)) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    // Check if page already exists
    const existingPage = await prisma.nameList.findFirst({
      where: {
        pageNumber,
        ...(options.seriesId && { seriesId: options.seriesId })
      }
    });

    if (existingPage) {
      throw new Error(`Page ${pageNumber} already exists`);
    }

    const title = options.title || PageHelpers.getPageTitle(pageNumber);

    return await prisma.nameList.create({
      data: {
        title,
        names: JSON.stringify(names),
        pageNumber,
        totalPages: options.totalPages,
        namesCount: names.length,
        seriesId: options.seriesId,
        description: options.description,
        createdBy: userId,
      }
    });
  }

  /**
   * Create multiple pages from a large list of names with metadata
   */
  static async createPagesFromNames(
    allNames: NameWithMetadata[],
    userId: string,
    options: {
      seriesId?: string;
      seriesTitle?: string;
      startPage?: number;
    } = {}
  ): Promise<NameList[]> {
    const startPage = options.startPage || CONFIG.PAGE.DEFAULT_START_PAGE;
    const totalPages = Math.ceil(allNames.length / CONFIG.PAGE.NAMES_PER_PAGE);
    const pages: NameList[] = [];

    for (let i = 0; i < totalPages; i++) {
      const pageNumber = startPage + i;
      const startIndex = i * CONFIG.PAGE.NAMES_PER_PAGE;
      const endIndex = Math.min(startIndex + CONFIG.PAGE.NAMES_PER_PAGE, allNames.length);
      const pageNames = allNames.slice(startIndex, endIndex);
      
      const page = await this.createPage(pageNames, pageNumber, userId, {
        title: PageHelpers.getPageTitle(pageNumber),
        seriesId: options.seriesId,
        totalPages,
      });

      pages.push(page);
    }

    return pages;
  }

  /**
   * Get page data with recordings
   */
  static async getPageData(pageNumber: number, seriesId?: string): Promise<PageData | null> {
    const namelist = await prisma.nameList.findFirst({
      where: {
        pageNumber,
        ...(seriesId && { seriesId })
      },
      include: {
        recordings: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    }) as NameListData | null;

    if (!namelist) return null;

    // Parse names safely
    let parsedNames: NameWithMetadata[];
    try {
      const rawNames = JSON.parse(namelist.names);
      // Handle both old format (string[]) and new format (NameWithMetadata[])
      if (Array.isArray(rawNames) && rawNames.length > 0) {
        if (typeof rawNames[0] === 'string') {
          // Old format - convert to new format
          parsedNames = rawNames.map(name => ({ name }));
        } else {
          // New format
          parsedNames = rawNames;
        }
      } else {
        parsedNames = [];
      }
    } catch (error) {
      console.error('Error parsing names JSON:', error);
      parsedNames = [];
    }

    return {
      id: namelist.id,
      pageNumber: namelist.pageNumber,
      title: namelist.title,
      names: parsedNames,
      namesCount: namelist.namesCount || parsedNames.length, // Fallback to parsed length
      totalPages: namelist.totalPages || undefined,
      seriesId: namelist.seriesId || undefined,
      hasRecording: namelist.recordings.length > 0,
      recordings: namelist.recordings,
      createdAt: namelist.createdAt,
    };
  }

  /**
   * Get all pages summary
   */
  static async getPagesSummary(seriesId?: string): Promise<PageSummary[]> {
    const namelists = await prisma.nameList.findMany({
      where: seriesId ? { seriesId } : {},
      include: {
        recordings: {
          select: {
            status: true,
            createdAt: true,
          }
        }
      },
      orderBy: { pageNumber: 'asc' }
    }) as NameListWithSummaryRecordings[];

    return namelists.map(namelist => {
      // Parse names to get count if namesCount is missing
      let namesCount = namelist.namesCount;
      if (!namesCount) {
        try {
          const parsedNames = JSON.parse(namelist.names);
          namesCount = Array.isArray(parsedNames) ? parsedNames.length : 0;
        } catch (error) {
          console.error('Error parsing names for count:', error);
          namesCount = 0;
        }
      }

      return {
        pageNumber: namelist.pageNumber,
        title: namelist.title,
        namesCount,
        recordingCount: namelist.recordings.length,
        hasApprovedRecording: namelist.recordings.some(r => r.status === 'APPROVED'),
        lastRecordingDate: namelist.recordings.length > 0 
          ? namelist.recordings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
          : undefined,
      };
    });
  }

  /**
   * Get next available page number
   */
  static async getNextPageNumber(seriesId?: string): Promise<number> {
    const lastPage = await prisma.nameList.findFirst({
      where: seriesId ? { seriesId } : {},
      orderBy: { pageNumber: 'desc' },
      select: { pageNumber: true }
    });

    return lastPage 
      ? lastPage.pageNumber + 1 
      : CONFIG.PAGE.DEFAULT_START_PAGE;
  }

  /**
   * Get pages that need recordings
   */
  static async getPagesNeedingRecordings(seriesId?: string): Promise<PageSummary[]> {
    const pages = await this.getPagesSummary(seriesId);
    return pages.filter(page => !page.hasApprovedRecording);
  }

  /**
   * Get recording statistics by page
   */
  static async getRecordingStats(seriesId?: string) {
    const pages = await this.getPagesSummary(seriesId);
    
    const totalPages = pages.length;
    const pagesWithRecordings = pages.filter(p => p.recordingCount > 0).length;
    const pagesWithApprovedRecordings = pages.filter(p => p.hasApprovedRecording).length;
    const totalRecordings = pages.reduce((sum, p) => sum + p.recordingCount, 0);
    const totalNames = pages.reduce((sum, p) => sum + p.namesCount, 0);

    return {
      totalPages,
      totalNames,
      totalRecordings,
      pagesWithRecordings,
      pagesWithApprovedRecordings,
      pagesNeedingRecordings: totalPages - pagesWithApprovedRecordings,
      completionPercentage: totalPages > 0 ? (pagesWithApprovedRecordings / totalPages) * 100 : 0,
      averageRecordingsPerPage: totalPages > 0 ? totalRecordings / totalPages : 0,
    };
  }

  /**
   * Search for pages by page number or name content
   */
  static async searchPages(query: string, seriesId?: string): Promise<PageData[]> {
    const pageNumber = parseInt(query);
    const isPageNumberSearch = !isNaN(pageNumber);

    const namelists = await prisma.nameList.findMany({
      where: {
        ...(seriesId && { seriesId }),
        OR: [
          ...(isPageNumberSearch ? [{ pageNumber }] : []),
          { title: { contains: query } },
          { names: { contains: query } }, // SQLite full-text search on JSON
        ]
      },
      include: {
        recordings: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { pageNumber: 'asc' }
    }) as NameListData[];

    return namelists.map(namelist => {
      // Parse names safely and handle conversion
      const parsedNames = this.parseNamesWithMetadata(namelist.names);

      return {
        id: namelist.id,
        pageNumber: namelist.pageNumber,
        title: namelist.title,
        names: parsedNames,
        namesCount: namelist.namesCount || parsedNames.length,
        totalPages: namelist.totalPages || undefined,
        seriesId: namelist.seriesId || undefined,
        hasRecording: namelist.recordings.length > 0,
        recordings: namelist.recordings,
        createdAt: namelist.createdAt,
      };
    });
  }

  /**
   * Get page by ID
   */
  static async getPageById(pageId: string): Promise<(PageData & { createdBy: string }) | null> {
    const namelist = await prisma.nameList.findUnique({
      where: { id: pageId },
      include: {
        recordings: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    }) as NameListData | null;

    if (!namelist) return null;

    // Parse names safely and handle conversion
    const parsedNames = this.parseNamesWithMetadata(namelist.names);

    return {
      id: namelist.id,
      pageNumber: namelist.pageNumber,
      title: namelist.title,
      names: parsedNames,
      namesCount: namelist.namesCount || parsedNames.length,
      totalPages: namelist.totalPages || undefined,
      seriesId: namelist.seriesId || undefined,
      hasRecording: namelist.recordings.length > 0,
      recordings: namelist.recordings,
      createdAt: namelist.createdAt,
      createdBy: namelist.createdBy,
    };
  }

  /**
   * Update page with flexible options
   */
  static async updatePage(
    pageId: string,
    updates: {
      names?: NameWithMetadata[];
      title?: string;
      description?: string;
    }
  ): Promise<NameList> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.names) {
      if (!Array.isArray(updates.names) || updates.names.length === 0 || updates.names.length > CONFIG.PAGE.NAMES_PER_PAGE) {
        throw new Error(`Page must contain 1-${CONFIG.PAGE.NAMES_PER_PAGE} names`);
      }
      updateData.names = JSON.stringify(updates.names);
      updateData.namesCount = updates.names.length;
    }

    if (updates.title) {
      updateData.title = updates.title;
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    return await prisma.nameList.update({
      where: { id: pageId },
      data: updateData,
    });
  }

  /**
   * Update page names (legacy method for backward compatibility)
   */
  static async updatePageNames(
    pageId: string, 
    newNames: string[] | NameWithMetadata[]
  ): Promise<NameList> {
    // Convert string array to NameWithMetadata array if needed
    const namesWithMetadata: NameWithMetadata[] = newNames.map(item => 
      typeof item === 'string' ? { name: item } : item
    );
    
    return this.updatePage(pageId, { names: namesWithMetadata });
  }

  /**
   * Delete a page (only if no recordings exist)
   */
  static async deletePage(pageId: string): Promise<void> {
    const page = await prisma.nameList.findUnique({
      where: { id: pageId },
      include: { recordings: true }
    });

    if (!page) {
      throw new Error('Page not found');
    }

    if (page.recordings.length > 0) {
      throw new Error('Cannot delete page with existing recordings');
    }

    await prisma.nameList.delete({
      where: { id: pageId }
    });
  }
}

// Export helper for use in API routes
export const pageManagerHelpers = {
  validatePageNumber: PageHelpers.isValidPageNumber,
  formatPageTitle: PageHelpers.getPageTitle,
  calculatePages: PageHelpers.calculateTotalPages,
  formatPageDisplay: PageHelpers.formatPageDisplay,
  isValidNamesPage: ValidationHelpers.isValidNamesPage,
};