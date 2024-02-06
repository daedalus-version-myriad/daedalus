"use client";

import EnableModule from "@/components/EnableModule";
import MultiChannelSelector from "@/components/MultiChannelSelector";
import MultiRoleSelector from "@/components/MultiRoleSelector";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import SingleRoleSelector from "@/components/SingleRoleSelector";
import XpTechIssueAlert from "@/components/XpTechIssueAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { textTypes } from "@/lib/data";
import { applyIndex, removeIndex } from "@/lib/processors";
import { GuildXpSettings } from "@daedalus/types";
import _ from "lodash";
import React, { useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa6";
import save from "./save";

export function Body({ data: initial, disabled }: { data: GuildXpSettings; disabled: boolean }) {
    const [data, setData] = useState<GuildXpSettings>(initial);

    const [blockedChannels, setBlockedChannels] = useState<string[]>(data.blockedChannels);
    const [blockedRoles, setBlockedRoles] = useState<string[]>(data.blockedRoles);
    const [bonusChannels, setBonusChannels] = useState<GuildXpSettings["bonusChannels"]>(data.bonusChannels);
    const [bonusRoles, setBonusRoles] = useState<GuildXpSettings["bonusRoles"]>(data.bonusRoles);
    const [rankCardBackground, setRankCardBackground] = useState<string>(data.rankCardBackground);
    const [announceLevelUp, setAnnounceLevelUp] = useState<boolean>(data.announceLevelUp);
    const [announceInChannel, setAnnounceInChannel] = useState<boolean>(data.announceInChannel);
    const [announceChannel, setAnnounceChannel] = useState<string | null>(data.announceChannel);
    const [announcementBackground, setAnnouncementBackground] = useState<string>(data.announcementBackground);
    const [rewards, setRewards] = useState<GuildXpSettings["rewards"]>(data.rewards);

    const updated = {
        guild: data.guild,
        blockedChannels,
        blockedRoles,
        bonusChannels,
        bonusRoles,
        rankCardBackground,
        announceLevelUp,
        announceInChannel,
        announceChannel,
        announcementBackground,
        rewards,
    };

    return (
        <>
            <EnableModule guild={data.guild} module="xp" disabled={disabled}></EnableModule>
            <Panel>
                <h1 className="text-xl">Blocked Channels</h1>
                <MultiChannelSelector channels={blockedChannels} setChannels={setBlockedChannels} showReadonly></MultiChannelSelector>
                <h1 className="text-xl">Blocked Roles</h1>
                <MultiRoleSelector roles={blockedRoles} setRoles={setBlockedRoles} showEveryone showHigher showManaged></MultiRoleSelector>
            </Panel>
            <Panel>
                <h1 className="text-xl">Bonus XP</h1>
                <h2 className="text-lg">Channels</h2>
                <p>
                    <span className="text-muted-foreground">
                        If a category and channel both have overrides, the channel&apos;s own will override the category&apos;s. They do not stack.
                    </span>
                </p>
                <div className="grid grid-cols-[repeat(3,max-content)] gap-2">
                    <span></span>
                    <b>Channel</b>
                    <b>Multiplier</b>
                    {bonusChannels.map(({ channel, multiplier }, i) => (
                        <React.Fragment key={`${i}`}>
                            <Button variant="outline" onClick={() => setBonusChannels((channels) => removeIndex(channels, i))}>
                                <FaTrash></FaTrash>
                            </Button>
                            <SingleChannelSelector
                                channel={channel}
                                setChannel={(channel) => setBonusChannels((channels) => applyIndex(channels, i, (d) => ({ ...d, channel })))}
                                showReadonly
                            ></SingleChannelSelector>
                            <Input
                                type="number"
                                value={`${multiplier}`}
                                onChange={({ currentTarget: { value } }) =>
                                    setBonusChannels((channels) => applyIndex(channels, i, (d) => ({ ...d, multiplier: +value ?? null })))
                                }
                            ></Input>
                        </React.Fragment>
                    ))}
                </div>
                <div>
                    <Button
                        variant="outline"
                        className="center-row gap-2"
                        onClick={() => setBonusChannels((channels) => [...channels, { channel: null, multiplier: 2 }])}
                    >
                        <FaPlus></FaPlus> Add Bonus XP Channel
                    </Button>
                </div>
                <h2 className="text-lg">Roles</h2>
                <p>
                    <span className="text-muted-foreground">If a user has multiple of these roles, the highest multiplier will apply. They do not stack.</span>
                </p>
                <div className="grid grid-cols-[repeat(3,max-content)] flex-center gap-2">
                    <span></span>
                    <b>Role</b>
                    <b>Multiplier</b>
                    {bonusRoles.map(({ role, multiplier }, i) => (
                        <React.Fragment key={`${i}`}>
                            <Button variant="outline" onClick={() => setBonusRoles((roles) => removeIndex(roles, i))}>
                                <FaTrash></FaTrash>
                            </Button>
                            <SingleRoleSelector
                                role={role}
                                setRole={(role) => setBonusRoles((roles) => applyIndex(roles, i, (d) => ({ ...d, role })))}
                                showEveryone
                                showHigher
                                showManaged
                            ></SingleRoleSelector>
                            <Input
                                type="number"
                                value={`${multiplier}`}
                                onChange={({ currentTarget: { value } }) =>
                                    setBonusRoles((roles) => applyIndex(roles, i, (d) => ({ ...d, multiplier: +value ?? null })))
                                }
                            ></Input>
                        </React.Fragment>
                    ))}
                </div>
                <div>
                    <Button variant="outline" className="center-row gap-2" onClick={() => setBonusRoles((roles) => [...roles, { role: null, multiplier: 2 }])}>
                        <FaPlus></FaPlus> Add Bonus XP Role
                    </Button>
                </div>
            </Panel>
            <Panel>
                <h1 className="text-xl">Level-Up Announcements</h1>
                <Label className="center-row gap-2">
                    <Switch checked={announceLevelUp} onCheckedChange={setAnnounceLevelUp}></Switch>
                    <p>Announce Level-ups</p>
                </Label>
                <Label className="center-row gap-2">
                    <Switch checked={announceInChannel} onCheckedChange={setAnnounceInChannel}></Switch>
                    <p>Announce in the channel where the user leveled up</p>
                </Label>
                {announceInChannel ? null : (
                    <SingleChannelSelector channel={announceChannel} setChannel={setAnnounceChannel} types={textTypes}></SingleChannelSelector>
                )}
                <XpTechIssueAlert></XpTechIssueAlert>
                <h2 className="text-lg">Rank Card Background</h2>
                <Input
                    value={rankCardBackground}
                    onChange={({ currentTarget: { value } }) => setRankCardBackground(value)}
                    placeholder="(URL &mdash; 1000 &times; 400)"
                ></Input>
                <h2 className="text-lg">Level-Up Announcement Background</h2>
                <Input
                    value={announcementBackground}
                    onChange={({ currentTarget: { value } }) => setAnnouncementBackground(value)}
                    placeholder="(URL &mdash; 1000 &times; 400)"
                ></Input>
            </Panel>
            <Panel>
                <div className="grid grid-cols-[repeat(6,max-content)] items-center gap-2">
                    <span></span>
                    <b>Text Level</b>
                    <b>Voice Level</b>
                    <b>Role</b>
                    <b>Remove on Higher Reward</b>
                    <b>DM on Reward</b>
                    {rewards.map(({ text, voice, role, removeOnHigher, dmOnReward }, i) => (
                        <React.Fragment key={`${i}`}>
                            <Button variant="outline" onClick={() => setRewards((rewards) => removeIndex(rewards, i))}>
                                <FaTrash></FaTrash>
                            </Button>
                            <Input
                                type="number"
                                value={`${text}`}
                                onChange={({ currentTarget: { value } }) =>
                                    setRewards((rewards) => applyIndex(rewards, i, (reward) => ({ ...reward, text: +value ?? null })))
                                }
                            ></Input>
                            <Input
                                type="number"
                                value={`${voice}`}
                                onChange={({ currentTarget: { value } }) =>
                                    setRewards((rewards) => applyIndex(rewards, i, (reward) => ({ ...reward, voice: +value ?? null })))
                                }
                            ></Input>
                            <SingleRoleSelector
                                role={role}
                                setRole={(role) => setRewards((rewards) => applyIndex(rewards, i, (reward) => ({ ...reward, role })))}
                            ></SingleRoleSelector>
                            <Switch
                                checked={removeOnHigher}
                                onCheckedChange={(removeOnHigher) =>
                                    setRewards((rewards) => applyIndex(rewards, i, (reward) => ({ ...reward, removeOnHigher })))
                                }
                            ></Switch>
                            <Switch
                                checked={dmOnReward}
                                onCheckedChange={(dmOnReward) => setRewards((rewards) => applyIndex(rewards, i, (reward) => ({ ...reward, dmOnReward })))}
                            ></Switch>
                        </React.Fragment>
                    ))}
                </div>
                <div>
                    <Button
                        variant="outline"
                        className="center-row gap-2"
                        onClick={() => setRewards((rewards) => [...rewards, { text: 1, voice: 1, role: null, removeOnHigher: false, dmOnReward: false }])}
                    >
                        <FaPlus></FaPlus> Add Reward
                    </Button>
                </div>
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => {
                    setBlockedChannels(data.blockedChannels);
                    setBlockedRoles(data.blockedRoles);
                    setBonusChannels(data.bonusChannels);
                    setBonusRoles(data.bonusRoles);
                    setRankCardBackground(data.rankCardBackground);
                    setAnnounceLevelUp(data.announceLevelUp);
                    setAnnounceInChannel(data.announceInChannel);
                    setAnnounceChannel(data.announceChannel);
                    setAnnouncementBackground(data.announcementBackground);
                    setRewards(data.rewards);
                }}
                save={async () => {
                    const error = await save(updated);
                    if (error) return alert(error);
                    setData(updated);
                }}
            ></SaveChangesBar>
        </>
    );
}
