/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, test, expect, afterEach } from 'vitest';

// Mock leaflet before the component import to avoid "window is not defined" in Node test env
vi.mock('leaflet', () => {
    const L: any = {
        latLng: (lat: number, lng: number) => ({ lat, lng, distanceTo: () => 0 }),
        point: (x: number, y: number) => ({ x, y }),
        divIcon: (opts: any) => ({ ...opts }),
        icon: (opts: any) => ({ ...opts }),
        popup: (opts: any) => ({
            setContent: () => ({})
        }),
        marker: (pos: any, opts?: any) => {
            const handlers: Record<string, Function[]> = {};
            const marker = {
                _pos: pos,
                options: opts,
                bindPopup: () => marker,
                on: (evt: string, fn: Function) => {
                    handlers[evt] = handlers[evt] || [];
                    handlers[evt].push(fn);
                },
                addTo: () => marker,
                openPopup: () => {},
                closePopup: () => {},
                remove: () => {}
            };
            return marker;
        }
    };
    return L;
});

import DeletedCablesSidebar from './DeletedCablesSidebar';

const mockRefetch = vi.fn();
const mockMutateAsync = vi.fn().mockResolvedValue({ success: true });

vi.mock('../../../hooks/useApi', () => {
    return {
        useDeletedCables: (lastUpdate?: string | null) => {
            return {
                data: [],
                isLoading: false,
                error: null,
                refetch: mockRefetch,
                isRefetching: false
            };
        },
        useDeleteCable: () => {
            return {
                mutateAsync: mockMutateAsync
            };
        }
    };
});

describe('DeletedCablesSidebar - fetchDeletedCables (Refresh)', () => {
    afterEach(() => {
        vi.clearAllMocks();
        cleanup();
    });

    test('calls refetchDeletedCables when Refresh is clicked (success)', async () => {
        mockRefetch.mockResolvedValueOnce(Promise.resolve());

        render(<DeletedCablesSidebar onSelectCable={vi.fn()} />);

        const refreshButton = screen.getByRole('button', { name: /Refresh/i });
        fireEvent.click(refreshButton);

        await waitFor(() => {
            expect(mockRefetch).toHaveBeenCalledTimes(1);
        });

        expect(screen.queryByText(/Fetch failed|Failed to fetch deleted cables|Network/i)).toBeNull();
    });

    test('shows an error notification when refetch throws', async () => {
        mockRefetch.mockRejectedValueOnce(new Error('Fetch failed'));

        render(<DeletedCablesSidebar onSelectCable={vi.fn()} />);

        const refreshButton = screen.getByRole('button', { name: /Refresh/i });
        fireEvent.click(refreshButton);

        await waitFor(() => {
            expect(mockRefetch).toHaveBeenCalledTimes(1);
        });

        await waitFor(() => {
            expect(screen.getByText('Fetch failed')).toBeTruthy();
        });
    });
});